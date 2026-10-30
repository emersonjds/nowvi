use std::path::PathBuf;
use std::time::Duration;

use axum::Router;
use axum::body::Body;
use axum::http::header::{
    CACHE_CONTROL, CONTENT_DISPOSITION, CONTENT_TYPE, X_CONTENT_TYPE_OPTIONS,
};
use axum::http::{Request, StatusCode};
use axum::response::Response;
use futures_util::StreamExt;
use sqlx::PgPool;

use crate::test_support::{
    CLIENT_IP, Limits, SECRET, all_slots_free, app, back_to_page_code, eventually, send, test_pool,
    unused_pool,
};
use crate::token::{self, Claims};

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

/// A token valid now for `run`, as `/api/info` would sign it.
fn claims(run: &FakeRun, platform: &str) -> Claims {
    let now = token::now();
    Claims {
        url: "https://x.com/i/status/1".into(),
        platform: platform.into(),
        format_id: format!("{}:{}", run.mode, run.pidfile.display()),
        ext: "mp4".into(),
        quality: "720p".into(),
        nbf: now - 1,
        exp: now + 600,
    }
}

async fn download_with(router: &Router, download_token: &str) -> Response {
    let request = Request::get(format!("/api/download?token={download_token}"))
        .header("x-real-ip", CLIENT_IP)
        .body(Body::empty())
        .expect("a valid request");
    send(router, request).await
}

async fn download(router: &Router, run: &FakeRun, platform: &str) -> Response {
    download_with(router, &token::sign(&SECRET, &claims(run, platform))).await
}

/// Polls `downloads` until the platform has a row.
async fn recorded_qualities(pool: &PgPool, platform: &str) -> Vec<String> {
    for _ in 0..100 {
        let qualities: Vec<String> =
            sqlx::query_scalar("SELECT quality FROM downloads WHERE platform = $1")
                .bind(platform)
                .fetch_all(pool)
                .await
                .expect("reading downloads");
        if !qualities.is_empty() {
            return qualities;
        }
        tokio::time::sleep(Duration::from_millis(50)).await;
    }
    Vec::new()
}

fn is_alive(pid: &str) -> bool {
    std::process::Command::new("kill")
        .args(["-0", pid])
        .stderr(std::process::Stdio::null())
        .status()
        .is_ok_and(|status| status.success())
}

#[tokio::test]
async fn a_client_that_never_reads_gives_its_slot_back_after_the_idle_timeout() {
    let (router, state) = app(
        unused_pool(),
        Limits {
            idle_timeout: Duration::from_secs(1),
            ..Limits::default()
        },
    );
    let first_run = FakeRun::new("flood", "idle-first");
    let second_run = FakeRun::new("flood", "idle-second");
    let _unread_first = download(&router, &first_run, "x").await;
    let _unread_second = download(&router, &second_run, "x").await;
    let third_run = FakeRun::new("flood", "idle-third");
    assert_eq!(
        back_to_page_code(&download(&router, &third_run, "x").await),
        Some("busy")
    );

    assert!(eventually(|| all_slots_free(&state)).await);
    assert!(!is_alive(&first_run.pid()));
    assert!(!is_alive(&second_run.pid()));
    let retry = download(&router, &third_run, "x").await;
    assert_eq!(retry.status(), StatusCode::OK);
}

#[tokio::test]
async fn a_client_that_disconnects_mid_stream_kills_yt_dlp_and_frees_the_slot() {
    let (router, state) = app(unused_pool(), Limits::default());
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
async fn a_complete_download_records_its_quality_and_frees_the_slot() {
    let pool = test_pool().await;
    let platform = format!("test-{}-{}", std::process::id(), token::now());
    let (router, state) = app(pool.clone(), Limits::default());
    let run = FakeRun::new("complete", "complete");
    let download_token = token::sign(
        &SECRET,
        &Claims {
            quality: "480p".into(),
            ..claims(&run, &platform)
        },
    );
    let response = download_with(&router, &download_token).await;
    assert_eq!(response.status(), StatusCode::OK);
    let video = axum::body::to_bytes(response.into_body(), 1024)
        .await
        .expect("the whole video");
    assert_eq!(&video[..], b"nowvi-video-bytes");

    assert!(eventually(|| all_slots_free(&state)).await);
    assert_eq!(recorded_qualities(&pool, &platform).await, ["480p"]);
}

#[tokio::test]
async fn a_download_cut_by_a_yt_dlp_error_fails_the_body_and_records_nothing() {
    let pool = test_pool().await;
    let platform = format!("test-partial-{}-{}", std::process::id(), token::now());
    let (router, state) = app(pool.clone(), Limits::default());
    let run = FakeRun::new("partial", "partial");
    let response = download_with(&router, &token::sign(&SECRET, &claims(&run, &platform))).await;
    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), 1024).await;

    assert!(
        body.is_err(),
        "a truncated video must not end like a complete one"
    );
    assert!(eventually(|| all_slots_free(&state)).await);
    assert!(recorded_qualities(&pool, &platform).await.is_empty());
}

#[tokio::test]
async fn a_token_signed_before_the_quality_claim_records_720p() {
    let pool = test_pool().await;
    let platform = format!("test-old-{}-{}", std::process::id(), token::now());
    let (router, _) = app(pool.clone(), Limits::default());
    let run = FakeRun::new("complete", "old-token");
    let download_token = token::sign(
        &SECRET,
        &Claims {
            quality: String::new(),
            ..claims(&run, &platform)
        },
    );
    let response = download_with(&router, &download_token).await;
    axum::body::to_bytes(response.into_body(), 1024)
        .await
        .expect("the whole video");

    assert_eq!(recorded_qualities(&pool, &platform).await, ["720p"]);
}

#[tokio::test]
async fn a_download_names_the_file_and_picks_the_content_type_by_ext() {
    let (router, state) = app(unused_pool(), Limits::default());
    let content_types = [
        ("mp4", "video/mp4"),
        ("webm", "video/webm"),
        ("3gp", "application/octet-stream"),
    ];
    for (ext, content_type) in content_types {
        let run = FakeRun::new("complete", &format!("ext-{ext}"));
        let download_token = token::sign(
            &SECRET,
            &Claims {
                ext: ext.into(),
                ..claims(&run, "x")
            },
        );
        let before = token::now();
        let response = download_with(&router, &download_token).await;
        assert_eq!(response.status(), StatusCode::OK);
        let headers = response.headers();
        assert_eq!(headers[CONTENT_TYPE], content_type);
        assert_eq!(headers[CACHE_CONTROL], "no-store");
        assert_eq!(headers[X_CONTENT_TYPE_OPTIONS], "nosniff");
        let disposition = headers[CONTENT_DISPOSITION].to_str().expect("ASCII");
        let unix: u64 = disposition
            .strip_prefix("attachment; filename=\"nowvi-x-")
            .and_then(|rest| rest.strip_suffix(&format!(".{ext}\"")))
            .and_then(|unix| unix.parse().ok())
            .unwrap_or_else(|| panic!("{disposition}"));
        assert!((before..=token::now()).contains(&unix));
        axum::body::to_bytes(response.into_body(), 1024)
            .await
            .expect("the whole video");
        assert!(eventually(|| all_slots_free(&state)).await);
    }
}

#[tokio::test]
async fn a_failed_download_goes_back_to_the_page_with_its_code() {
    let (router, _) = app(unused_pool(), Limits::default());
    let run = FakeRun::new("empty", "failed");
    let now = token::now();
    let signed = |claims: Claims| token::sign(&SECRET, &claims);
    let valid_token = signed(claims(&run, "x"));
    let (_, valid_signature) = valid_token.split_once('.').expect("two parts");
    let other_token = signed(Claims {
        format_id: "other-format".into(),
        ..claims(&run, "x")
    });
    let (other_payload, _) = other_token.split_once('.').expect("two parts");
    let failures = [
        ("garbage".to_owned(), "invalid_token"),
        (
            format!("{other_payload}.{valid_signature}"),
            "invalid_token",
        ),
        (
            signed(Claims {
                url: "not a url".into(),
                ..claims(&run, "x")
            }),
            "invalid_token",
        ),
        (
            signed(Claims {
                nbf: now + 60,
                exp: now + 960,
                ..claims(&run, "x")
            }),
            "too_early",
        ),
        (
            signed(Claims {
                nbf: now - 960,
                exp: now - 1,
                ..claims(&run, "x")
            }),
            "expired",
        ),
        (valid_token.clone(), "extract_failed"),
    ];
    for (download_token, code) in failures {
        let response = download_with(&router, &download_token).await;
        assert_eq!(back_to_page_code(&response), Some(code), "{download_token}");
    }
    let without_token = Request::get("/api/download")
        .header("x-real-ip", CLIENT_IP)
        .body(Body::empty())
        .expect("a valid request");
    assert_eq!(
        back_to_page_code(&send(&router, without_token).await),
        Some("invalid_token")
    );
}

#[tokio::test]
async fn past_the_burst_a_download_goes_back_to_the_page_as_rate_limited() {
    let (router, _) = app(unused_pool(), Limits::default());
    for _ in 0..10 {
        let response = download_with(&router, "garbage").await;
        assert_eq!(back_to_page_code(&response), Some("invalid_token"));
    }
    let response = download_with(&router, "garbage").await;
    assert_eq!(back_to_page_code(&response), Some("rate_limited"));
}

#[tokio::test]
async fn a_download_past_the_deadline_kills_yt_dlp_and_fails_the_body() {
    let (router, state) = app(
        unused_pool(),
        Limits {
            deadline: Duration::from_secs(1),
            ..Limits::default()
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
