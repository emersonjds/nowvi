//! The whole router with the fake yt-dlp, the test Postgres and the helpers the router tests share.

use std::sync::Arc;
use std::time::Duration;

use axum::Router;
use axum::body::Body;
use axum::http::header::LOCATION;
use axum::http::{HeaderValue, Request, StatusCode};
use axum::response::Response;
use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;
use tokio::sync::Semaphore;
use tower::ServiceExt;

use crate::AppState;
use crate::config::Config;
use crate::rate_limit::RateLimits;

pub const FAKE_YTDLP: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/tests/fixtures/fake-ytdlp.sh");
pub const SECRET: [u8; 32] = [7; 32];
pub const WEB_ORIGIN: &str = "http://localhost:3000";
pub const AD_WAIT_SECONDS: u64 = 30;
pub const CLIENT_IP: &str = "203.0.113.7";
pub const LONG: Duration = Duration::from_secs(60);

/// The knobs a test turns; the rest of the config is fixed.
pub struct Limits {
    pub max_jobs: usize,
    pub idle_timeout: Duration,
    pub deadline: Duration,
}

impl Default for Limits {
    fn default() -> Self {
        Limits {
            max_jobs: 2,
            idle_timeout: LONG,
            deadline: LONG,
        }
    }
}

pub fn app(pool: PgPool, limits: Limits) -> (Router, AppState) {
    let state = AppState {
        pool,
        config: Arc::new(Config {
            port: 0,
            database_url: String::new(),
            token_secret: SECRET.to_vec(),
            web_origins: vec![HeaderValue::from_static(WEB_ORIGIN)],
            ad_wait_seconds: AD_WAIT_SECONDS,
            max_concurrent_jobs: limits.max_jobs,
            ytdlp_bin: FAKE_YTDLP.into(),
            stream_idle_timeout: limits.idle_timeout,
            stream_deadline: limits.deadline,
        }),
        jobs: Arc::new(Semaphore::new(limits.max_jobs)),
        limits: Arc::new(RateLimits::default()),
    };
    (crate::router(state.clone()), state)
}

/// For the tests that never reach the database.
pub fn unused_pool() -> PgPool {
    PgPoolOptions::new()
        .connect_lazy("postgres://nowvi@127.0.0.1:1/unused")
        .expect("a lazy pool never connects")
}

pub async fn test_pool() -> PgPool {
    let database_url = std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:nowvi@127.0.0.1:55432/postgres".into());
    crate::db::connect(&database_url)
        .await
        .expect("Postgres for the tests: docker run -p 55432:5432 postgres:16-alpine")
}

pub async fn send(router: &Router, request: Request<Body>) -> Response {
    router
        .clone()
        .oneshot(request)
        .await
        .expect("the router never fails")
}

/// The `<code>` of a `303 <WEB_ORIGIN>/?erro=<code>`.
pub fn back_to_page_code(response: &Response) -> Option<&str> {
    if response.status() != StatusCode::SEE_OTHER {
        return None;
    }
    response
        .headers()
        .get(LOCATION)?
        .to_str()
        .ok()?
        .strip_prefix(&format!("{WEB_ORIGIN}/?erro="))
}

/// Polls `check` for up to 5 s.
pub async fn eventually(check: impl Fn() -> bool) -> bool {
    for _ in 0..100 {
        if check() {
            return true;
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    check()
}

pub fn all_slots_free(state: &AppState) -> bool {
    state.jobs.available_permits() == state.config.max_concurrent_jobs
}
