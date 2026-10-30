//! In-memory token bucket per client IP for `/api/*`: burst of 10, one request back every 3 s.

use std::collections::HashMap;
use std::net::{IpAddr, SocketAddr};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use axum::extract::{ConnectInfo, Request, State};
use axum::http::HeaderMap;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};

use crate::AppState;
use crate::error::AppError;

const BURST: f64 = 10.0;
const REFILL: Duration = Duration::from_secs(3);
/// ponytail: a full table evicts an arbitrary entry and one process holds the counters;
/// a shared store (Redis) if a flood of addresses or a second replica matters.
const MAX_ENTRIES: usize = 100_000;

struct Bucket {
    tokens: f64,
    at: Instant,
}

#[derive(Default)]
pub struct RateLimits {
    buckets: Mutex<HashMap<IpAddr, Bucket>>,
}

impl RateLimits {
    fn check(&self, address: IpAddr, now: Instant) -> Result<(), AppError> {
        let mut buckets = self
            .buckets
            .lock()
            .unwrap_or_else(|poison| poison.into_inner());
        if buckets.len() >= MAX_ENTRIES
            && !buckets.contains_key(&address)
            && let Some(evicted) = buckets.keys().next().copied()
        {
            buckets.remove(&evicted);
        }
        let bucket = buckets.entry(address).or_insert(Bucket {
            tokens: BURST,
            at: now,
        });
        let refilled = now.duration_since(bucket.at).as_secs_f64() / REFILL.as_secs_f64();
        bucket.tokens = (bucket.tokens + refilled).min(BURST);
        bucket.at = now;
        if bucket.tokens < 1.0 {
            let wait = REFILL.as_secs_f64() * (1.0 - bucket.tokens);
            return Err(AppError::RateLimited {
                retry_after: (wait.ceil() as u64).max(1),
            });
        }
        bucket.tokens -= 1.0;
        Ok(())
    }

    /// Drops full buckets; called by a timer, never on a request.
    pub fn prune(&self) {
        let now = Instant::now();
        self.buckets
            .lock()
            .unwrap_or_else(|poison| poison.into_inner())
            .retain(|_, bucket| now.duration_since(bucket.at) < REFILL.mul_f64(BURST));
    }
}

/// Railway's edge appends the client to `X-Forwarded-For`, so the last entry is the one to
/// trust; entries to its left are client-controlled. Without the header, the peer.
fn client_ip(headers: &HeaderMap, peer: Option<IpAddr>) -> Option<IpAddr> {
    headers
        .get_all("x-forwarded-for")
        .iter()
        .filter_map(|value| value.to_str().ok())
        .flat_map(|value| value.split(','))
        .next_back()
        .and_then(|last| last.trim().parse().ok())
        .or(peer)
}

pub async fn limit(State(state): State<AppState>, request: Request, next: Next) -> Response {
    let peer = request
        .extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .map(|ConnectInfo(address)| address.ip());
    if let Some(address) = client_ip(request.headers(), peer)
        && let Err(error) = state.limits.check(address.to_canonical(), Instant::now())
    {
        return error.into_response();
    }
    next.run(request).await
}
