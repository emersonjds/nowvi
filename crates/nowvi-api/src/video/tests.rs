use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use axum::Router;
use axum::body::Body;
use axum::http::header::{CONTENT_TYPE, LOCATION};
use axum::http::{HeaderValue, Request, StatusCode};
use axum::response::Response;
use axum::routing::get;
use futures_util::StreamExt;
use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;
use tokio::sync::Semaphore;
use tower::ServiceExt;

use crate::AppState;
use crate::config::Config;
use crate::rate_limit::RateLimits;
use crate::token::{self, Claims};

const FAKE_YTDLP: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/tests/fixtures/fake-ytdlp.sh");
const MAX_JOBS: usize = 2;
const LONG: Duration = Duration::from_secs(60);

struct Limits {
    idle_timeout: Duration,
    deadline: Duration,
}

fn app(pool: PgPool, limits: Limits) -> (Router, AppState) {
    let state = AppState {
        pool,
        config: Arc::new(Config {
            port: 0,
            database_url: String::new(),
            token_secret: vec![7; 32],
            web_origins: vec![HeaderValue::from_static("http://localhost:3000")],
            ad_wait_seconds: 0,
            max_concurrent_jobs: MAX_JOBS,
            ytdlp_bin: FAKE_YTDLP.into(),
            stream_idle_timeout: limits.idle_timeout,
            stream_deadline: limits.deadline,
        }),
        jobs: Arc::new(Semaphore::new(MAX_JOBS)),
        limits: Arc::new(RateLimits::default()),
    };
    let router = Router::new()
        .route("/api/download", get(super::download))
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            crate::rate_limit::limit,
        ))
        .with_state(state.clone());
    (router, state)
}

fn unused_pool() -> PgPool {
    PgPoolOptions::new()
        .connect_lazy("postgres://nowvi@127.0.0.1:1/unused")
        .expect("a lazy pool never connects")
}

/// A fake yt-dlp run: `mode` picks what the fixture prints, `pidfile` is where it writes its pid.
struct FakeRun {
    mode: &'static str,
    pidfile: PathBuf,
}

impl FakeRun {
    fn new(mode: &'static str, name: &str) -> Self {
        let pidfile = std::env::temp_dir().join(format!("nowvi-{name}-{}.pid", std::process::id()));
        let _ = std::fs::remove_file(&pidfile);
        FakeRun { mode, pidfile }
    }

    fn pid(&self) -> String {
        std::fs::read_to_string(&self.pidfile)
            .expect("the fixture writes its pid before any byte")
            .trim()
            .to_owned()
    }
}

async fn download(router: &Router, run: &FakeRun, platform: &str) -> Response {
    let now = token::now();
    let download_token = token::sign(
        &[7; 32],
        &Claims {
            u: "https://x.com/i/status/1".into(),
            p: platform.into(),
            f: format!("{}:{}", run.mode, run.pidfile.display()),
            e: "mp4".into(),
            q: "720p".into(),
            nbf: now - 1,
            exp: now + 600,
        },
    );
    let request = Request::get(format!("/api/download?token={download_token}"))
        .header("x-real-ip", "203.0.113.7")
        .body(Body::empty())
        .expect("a valid request");
    router
        .clone()
        .oneshot(request)
        .await
        .expect("the router never fails")
}

fn is_alive(pid: &str) -> bool {
    std::process::Command::new("kill")
        .args(["-0", pid])
        .stderr(std::process::Stdio::null())
        .status()
        .is_ok_and(|status| status.success())
}

/// Polls `check` for up to 5 s.
async fn eventually(check: impl Fn() -> bool) -> bool {
    for _ in 0..100 {
        if check() {
            return true;
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    check()
}

fn all_slots_free(state: &AppState) -> bool {
    state.jobs.available_permits() == MAX_JOBS
}

fn is_busy(response: &Response) -> bool {
    response.status() == StatusCode::SEE_OTHER
        && response
            .headers()
            .get(LOCATION)
            .is_some_and(|location| location == "http://localhost:3000/?erro=busy")
}

#[tokio::test]
async fn a_client_that_never_reads_gives_its_slot_back_after_the_idle_timeout() {
    let (router, state) = app(
        unused_pool(),
        Limits {
            idle_timeout: Duration::from_secs(1),
            deadline: LONG,
        },
    );
    let first_run = FakeRun::new("flood", "idle-first");
    let second_run = FakeRun::new("flood", "idle-second");
    let _unread_first = download(&router, &first_run, "x").await;
    let _unread_second = download(&router, &second_run, "x").await;
    let third_run = FakeRun::new("flood", "idle-third");
    assert!(is_busy(&download(&router, &third_run, "x").await));

    assert!(eventually(|| all_slots_free(&state)).await);
    assert!(!is_alive(&first_run.pid()));
    assert!(!is_alive(&second_run.pid()));
    let retry = download(&router, &third_run, "x").await;
    assert_eq!(retry.status(), StatusCode::OK);
}

#[tokio::test]
async fn a_client_that_disconnects_mid_stream_kills_yt_dlp_and_frees_the_slot() {
    let (router, state) = app(
        unused_pool(),
        Limits {
            idle_timeout: LONG,
            deadline: LONG,
        },
    );
    let run = FakeRun::new("flood", "disconnect");
    let response = download(&router, &run, "x").await;
    let mut body = response.into_body().into_data_stream();
    for _ in 0..3 {
        assert!(body.next().await.is_some_and(|chunk| chunk.is_ok()));
    }
    drop(body);

    let pid = run.pid();
    assert!(eventually(|| !is_alive(&pid)).await);
    assert!(eventually(|| all_slots_free(&state)).await);
}

#[tokio::test]
async fn a_complete_download_is_recorded_and_frees_the_slot() {
    let database_url = std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:nowvi@127.0.0.1:55432/postgres".into());
    let pool = crate::db::connect(&database_url)
        .await
        .expect("Postgres for the tests: docker run -p 55432:5432 postgres:16-alpine");
    let platform = format!("test-{}-{}", std::process::id(), token::now());
    let (router, state) = app(
        pool.clone(),
        Limits {
            idle_timeout: LONG,
            deadline: LONG,
        },
    );
    let run = FakeRun::new("complete", "complete");
    let response = download(&router, &run, &platform).await;
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.headers()[CONTENT_TYPE], "video/mp4");
    let video = axum::body::to_bytes(response.into_body(), 1024)
        .await
        .expect("the whole video");
    assert_eq!(&video[..], b"nowvi-video-bytes");

    assert!(eventually(|| all_slots_free(&state)).await);
    let mut recorded = 0;
    for _ in 0..100 {
        recorded =
            sqlx::query_scalar::<_, i64>("SELECT count(*) FROM downloads WHERE platform = $1")
                .bind(&platform)
                .fetch_one(&pool)
                .await
                .expect("counting downloads");
        if recorded > 0 {
            break;
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    assert_eq!(recorded, 1);
}

#[tokio::test]
async fn a_download_past_the_deadline_kills_yt_dlp_and_fails_the_body() {
    let (router, state) = app(
        unused_pool(),
        Limits {
            idle_timeout: LONG,
            deadline: Duration::from_secs(1),
        },
    );
    let run = FakeRun::new("drip", "deadline");
    let response = download(&router, &run, "x").await;
    let mut body = response.into_body().into_data_stream();
    let ending = tokio::time::timeout(Duration::from_secs(5), async {
        loop {
            match body.next().await {
                Some(Ok(_)) => continue,
                Some(Err(_)) => return "error",
                None => return "clean end",
            }
        }
    })
    .await;
    assert_eq!(ending, Ok("error"));

    let pid = run.pid();
    assert!(eventually(|| !is_alive(&pid)).await);
    assert!(eventually(|| all_slots_free(&state)).await);
}
