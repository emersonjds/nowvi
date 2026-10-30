//! Per-client protections for `/api/*`: a token bucket (burst of 10, one request back every 3 s)
//! and at most 2 yt-dlp jobs in flight, counting info and download. IPv6 counts per /64 for the
//! bucket and per /48 for the jobs.

use std::collections::HashMap;
use std::net::{IpAddr, Ipv6Addr, SocketAddr};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use axum::extract::{ConnectInfo, Request, State};
use axum::http::HeaderMap;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};

use crate::AppState;
use crate::error::AppError;

const BURST: f64 = 10.0;
const REFILL: Duration = Duration::from_secs(3);
const JOBS_PER_CLIENT: u32 = 2;
/// ponytail: a full table evicts an arbitrary entry and one process holds the counters;
/// a shared store (Redis) if a flood of addresses or a second replica matters.
const MAX_ENTRIES: usize = 100_000;

struct Bucket {
    tokens: f64,
    refilled_at: Instant,
}

impl Bucket {
    fn full(now: Instant) -> Self {
        Bucket {
            tokens: BURST,
            refilled_at: now,
        }
    }

    fn take(&mut self, now: Instant) -> Result<(), AppError> {
        let refilled_tokens =
            now.duration_since(self.refilled_at).as_secs_f64() / REFILL.as_secs_f64();
        self.tokens = (self.tokens + refilled_tokens).min(BURST);
        self.refilled_at = now;
        if self.tokens < 1.0 {
            let wait_seconds = REFILL.as_secs_f64() * (1.0 - self.tokens);
            return Err(AppError::RateLimited {
                retry_after: (wait_seconds.ceil() as u64).max(1),
            });
        }
        self.tokens -= 1.0;
        Ok(())
    }
}

fn evict_one_when_full(buckets: &mut HashMap<IpAddr, Bucket>, newcomer: IpAddr) {
    if buckets.len() >= MAX_ENTRIES
        && !buckets.contains_key(&newcomer)
        && let Some(evicted) = buckets.keys().next().copied()
    {
        buckets.remove(&evicted);
    }
}

/// The client as the limits see it: the IPv4 address, or the /64 of an IPv6 one.
#[derive(Clone, Copy)]
pub struct ClientIp(IpAddr);

#[derive(Default)]
pub struct RateLimits {
    buckets: Mutex<HashMap<IpAddr, Bucket>>,
    jobs: Mutex<HashMap<IpAddr, u32>>,
}

/// One job of a client; dropping it gives the job back.
pub struct JobGuard {
    limits: Arc<RateLimits>,
    client: IpAddr,
}

impl Drop for JobGuard {
    fn drop(&mut self) {
        let mut jobs = self
            .limits
            .jobs
            .lock()
            .unwrap_or_else(|poison| poison.into_inner());
        if let Some(count) = jobs.get_mut(&self.client) {
            *count = count.saturating_sub(1);
            if *count == 0 {
                jobs.remove(&self.client);
            }
        }
    }
}

impl RateLimits {
    fn check(&self, address: IpAddr, now: Instant) -> Result<(), AppError> {
        let mut buckets = self
            .buckets
            .lock()
            .unwrap_or_else(|poison| poison.into_inner());
        evict_one_when_full(&mut buckets, address);
        buckets
            .entry(address)
            .or_insert_with(|| Bucket::full(now))
            .take(now)
    }

    /// `busy` once the client already has `JOBS_PER_CLIENT` jobs in flight.
    pub fn start_job(self: &Arc<Self>, ClientIp(client): ClientIp) -> Result<JobGuard, AppError> {
        let client = ipv6_prefix(client, 48);
        let mut jobs = self
            .jobs
            .lock()
            .unwrap_or_else(|poison| poison.into_inner());
        let count = jobs.entry(client).or_insert(0);
        if *count >= JOBS_PER_CLIENT {
            return Err(AppError::Busy);
        }
        *count += 1;
        Ok(JobGuard {
            limits: self.clone(),
            client,
        })
    }

    /// Drops full buckets; called by a timer, never on a request.
    pub fn prune(&self) {
        let now = Instant::now();
        self.buckets
            .lock()
            .unwrap_or_else(|poison| poison.into_inner())
            .retain(|_, bucket| now.duration_since(bucket.refilled_at) < REFILL.mul_f64(BURST));
    }
}

/// Railway's edge sets `X-Real-IP` and appends the client to `X-Forwarded-For`: only the last
/// entry is trusted, entries to its left are client-controlled. Without either, the peer.
fn client_ip(headers: &HeaderMap, peer: Option<IpAddr>) -> ClientIp {
    let real_ip = headers
        .get("x-real-ip")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.trim().parse().ok());
    let forwarded = || {
        headers
            .get_all("x-forwarded-for")
            .iter()
            .filter_map(|value| value.to_str().ok())
            .flat_map(|value| value.split(','))
            .next_back()
            .and_then(|last| last.trim().parse().ok())
    };
    let address: IpAddr = real_ip
        .or_else(forwarded)
        .or(peer)
        .unwrap_or(IpAddr::V6(Ipv6Addr::UNSPECIFIED));
    ClientIp(ipv6_prefix(address.to_canonical(), 64))
}

/// The first `bits` of an IPv6 address; an IPv4 one stays whole.
fn ipv6_prefix(address: IpAddr, bits: u32) -> IpAddr {
    match address {
        IpAddr::V6(ipv6) => IpAddr::V6(Ipv6Addr::from(u128::from(ipv6) & (!0u128 << (128 - bits)))),
        ipv4 => ipv4,
    }
}

/// Checks the bucket and hands the `ClientIp` to the handlers.
pub async fn limit(State(state): State<AppState>, mut request: Request, next: Next) -> Response {
    let peer = request
        .extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .map(|ConnectInfo(address)| address.ip());
    let client = client_ip(request.headers(), peer);
    if let Err(error) = state.limits.check(client.0, Instant::now()) {
        if request.uri().path() == "/api/download" {
            return crate::video::back_to_page(&state, &error);
        }
        return error.into_response();
    }
    request.extensions_mut().insert(client);
    next.run(request).await
}

#[cfg(test)]
mod tests {
    use super::*;

    fn client(address: &str) -> ClientIp {
        let mut headers = HeaderMap::new();
        headers.insert("x-real-ip", address.parse().expect("a header value"));
        client_ip(&headers, None)
    }

    #[test]
    fn ipv6_jobs_count_per_48_while_the_rate_limit_counts_per_64() {
        let limits = Arc::new(RateLimits::default());
        let first_64 = client("2001:db8:1:1::1");
        let second_64 = client("2001:db8:1:2::1");
        let _first_job = limits.start_job(first_64).expect("first job");
        let _second_job = limits.start_job(second_64).expect("second job");
        assert!(matches!(
            limits.start_job(client("2001:db8:1:3::1")),
            Err(AppError::Busy)
        ));
        assert!(limits.start_job(client("2001:db8:2::1")).is_ok());

        let now = Instant::now();
        for _ in 0..BURST as usize {
            limits.check(first_64.0, now).expect("within the burst");
        }
        assert!(limits.check(first_64.0, now).is_err());
        assert!(limits.check(second_64.0, now).is_ok());
    }

    fn address(text: &str) -> IpAddr {
        text.parse().expect("an IP address")
    }

    fn headers(pairs: &[(&'static str, &'static str)]) -> HeaderMap {
        let mut headers = HeaderMap::new();
        for (name, value) in pairs {
            headers.append(*name, value.parse().expect("a header value"));
        }
        headers
    }

    #[test]
    fn x_real_ip_wins_over_the_last_forwarded_for_entry_and_the_peer() {
        let peer = Some(address("10.0.0.1"));
        let both = headers(&[
            ("x-real-ip", "203.0.113.7"),
            ("x-forwarded-for", "198.51.100.1, 198.51.100.2"),
        ]);
        assert_eq!(client_ip(&both, peer).0, address("203.0.113.7"));
        let forwarded_only = headers(&[
            ("x-forwarded-for", "198.51.100.1"),
            ("x-forwarded-for", "6.6.6.6, 198.51.100.2"),
        ]);
        assert_eq!(client_ip(&forwarded_only, peer).0, address("198.51.100.2"));
        let unparseable = headers(&[("x-real-ip", "not-an-ip"), ("x-forwarded-for", "nope")]);
        assert_eq!(client_ip(&unparseable, peer).0, address("10.0.0.1"));
        assert_eq!(client_ip(&HeaderMap::new(), None).0, address("::"));
    }

    #[test]
    fn ipv6_counts_per_64_and_a_mapped_ipv4_counts_as_ipv4() {
        assert_eq!(client("2001:db8:1:1:aaaa::1").0, address("2001:db8:1:1::"));
        assert_eq!(client("::ffff:203.0.113.7").0, address("203.0.113.7"));
    }

    #[test]
    fn past_the_burst_a_client_waits_one_refill_for_the_next_request() {
        let limits = RateLimits::default();
        let client = address("203.0.113.7");
        let start = Instant::now();
        for _ in 0..BURST as usize {
            limits.check(client, start).expect("within the burst");
        }
        assert_eq!(
            limits.check(client, start),
            Err(AppError::RateLimited { retry_after: 3 })
        );
        assert_eq!(limits.check(client, start + REFILL), Ok(()));
    }

    #[test]
    fn prune_drops_the_buckets_idle_for_a_full_refill_and_keeps_the_rest() {
        let limits = RateLimits::default();
        let now = Instant::now();
        let full_refill_ago = now
            .checked_sub(REFILL.mul_f64(BURST))
            .expect("the clock runs past 30 s");
        limits
            .check(address("203.0.113.1"), full_refill_ago)
            .expect("a first request");
        limits
            .check(address("203.0.113.2"), now)
            .expect("a first request");
        limits.prune();
        let buckets = limits.buckets.lock().expect("an unpoisoned lock");
        assert_eq!(buckets.len(), 1);
        assert!(buckets.contains_key(&address("203.0.113.2")));
    }

    #[test]
    fn a_full_table_evicts_one_entry_for_a_new_client() {
        let limits = RateLimits::default();
        let now = Instant::now();
        for index in 0..MAX_ENTRIES as u32 {
            limits
                .check(IpAddr::from(index.to_be_bytes()), now)
                .expect("a first request");
        }
        limits
            .check(address("255.255.255.255"), now)
            .expect("a first request");
        let buckets = limits.buckets.lock().expect("an unpoisoned lock");
        assert_eq!(buckets.len(), MAX_ENTRIES);
        assert!(buckets.contains_key(&address("255.255.255.255")));
    }
}
