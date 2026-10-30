use std::path::PathBuf;
use std::time::Duration;

use axum::Router;
use axum::body::Body;
use axum::http::header::CONTENT_TYPE;
use axum::http::{Request, StatusCode};
use axum::response::Response;
use futures_util::StreamExt;

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

async fn download(router: &Router, run: &FakeRun, platform: &str) -> Response {
    let now = token::now();
    let download_token = token::sign(
        &SECRET,
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
        .header("x-real-ip", CLIENT_IP)
        .body(Body::empty())
        .expect("a valid request");
    send(router, request).await
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
async fn a_complete_download_is_recorded_and_frees_the_slot() {
    let pool = test_pool().await;
    let platform = format!("test-{}-{}", std::process::id(), token::now());
    let (router, state) = app(pool.clone(), Limits::default());
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
