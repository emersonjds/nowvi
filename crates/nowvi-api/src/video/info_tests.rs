use axum::Router;
use axum::body::Body;
use axum::http::header::{CONTENT_TYPE, RETRY_AFTER};
use axum::http::{Request, StatusCode};
use axum::response::Response;
use serde_json::{Value, json};

use crate::test_support::{
    AD_WAIT_SECONDS, CLIENT_IP, Limits, SECRET, all_slots_free, app, eventually, json_body, send,
    unused_pool,
};
use crate::token;

async fn post_info(router: &Router, body: impl Into<Body>, client_ip: &str) -> Response {
    let request = Request::post("/api/info")
        .header(CONTENT_TYPE, "application/json")
        .header("x-real-ip", client_ip)
        .body(body.into())
        .expect("a valid request");
    send(router, request).await
}

/// The fake yt-dlp answers by the URL's last path segment (see `fake-ytdlp.sh`).
async fn info_for(router: &Router, url: &str) -> Response {
    post_info(router, json!({ "url": url }).to_string(), CLIENT_IP).await
}

async fn status_and_body(response: Response) -> (StatusCode, Value) {
    (response.status(), json_body(response).await)
}

fn error(status: StatusCode, code: &str) -> (StatusCode, Value) {
    (status, json!({ "error": code }))
}

/// Verifies each token against its row, then blanks the tokens and `available_at` for a literal
/// comparison of the rest of the body. Returns the `format_id` each free token downloads.
fn verified_format_ids(info: &mut Value, url: &str) -> Vec<String> {
    let available_at = info["free"]["available_at"].as_u64().expect("available_at");
    let expected_available_at = token::now() + AD_WAIT_SECONDS;
    assert!((expected_available_at - 5..=expected_available_at).contains(&available_at));
    let platform = info["platform"].as_str().expect("platform").to_owned();
    let first_free_token = info["formats"]
        .as_array()
        .expect("formats")
        .iter()
        .find(|format| format["tier"] == "free")
        .map(|format| format["token"].clone());
    assert_eq!(Some(&info["free"]["token"]), first_free_token.as_ref());
    let mut format_ids = Vec::new();
    for format in info["formats"].as_array_mut().expect("formats") {
        let Some(download_token) = format["token"].as_str() else {
            continue;
        };
        let claims = token::verify(&SECRET, download_token, available_at)
            .expect("a token valid from available_at");
        assert_eq!(claims.url, url);
        assert_eq!(claims.platform, platform);
        assert_eq!(format["ext"], claims.ext.as_str());
        assert_eq!(format["quality"], claims.quality.as_str());
        assert_eq!(
            (claims.nbf, claims.exp),
            (available_at, available_at + token::LIFETIME_SECONDS)
        );
        format_ids.push(claims.format_id);
        format["token"] = json!("<token>");
    }
    info["free"]["token"] = json!("<token>");
    info["free"]["available_at"] = json!("<available_at>");
    format_ids
}

#[tokio::test]
async fn a_tiktok_video_lists_its_free_qualities_largest_first() {
    let (router, _) = app(unused_pool(), Limits::default());
    let url = "https://www.tiktok.com/@scout2015/video/tiktok";
    let (status, mut info) = status_and_body(info_for(&router, url).await).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        verified_format_ids(&mut info, url),
        ["bytevc1_720p_1504834-0", "h264_540p_2240963-0"]
    );
    assert_eq!(
        info,
        json!({
            "platform": "tiktok",
            "title": "Scout's first day at the beach",
            "author": "scout2015",
            "thumbnail": "https://p16-sign.tiktokcdn-us.com/scout2015.jpeg",
            "duration_seconds": 10,
            "free": {
                "height": 720,
                "filesize_bytes": 2004627,
                "token": "<token>",
                "available_at": "<available_at>",
                "wait_seconds": 30,
                "expires_in_seconds": 930
            },
            "full_hd_available": false,
            "formats": [
                { "quality": "720p", "height": 720, "ext": "mp4", "filesize_bytes": 2004627, "tier": "free", "token": "<token>", "h264": false },
                { "quality": "576p", "height": 576, "ext": "mp4", "filesize_bytes": 2953029, "tier": "free", "token": "<token>", "h264": true }
            ]
        })
    );
}

#[tokio::test]
async fn an_x_video_sells_1080p_without_a_token_and_drops_its_http_thumbnail() {
    let (router, _) = app(unused_pool(), Limits::default());
    let url = "https://x.com/SpaceX/status/x";
    let (status, mut info) = status_and_body(info_for(&router, url).await).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        verified_format_ids(&mut info, url),
        ["http-2176", "http-832", "http-256"]
    );
    assert_eq!(
        info,
        json!({
            "platform": "x",
            "title": "SpaceX - Falcon Heavy launch",
            "author": "SpaceX",
            "thumbnail": null,
            "duration_seconds": 47,
            "free": {
                "height": 720,
                "filesize_bytes": 31095584,
                "token": "<token>",
                "available_at": "<available_at>",
                "wait_seconds": 30,
                "expires_in_seconds": 930
            },
            "full_hd_available": true,
            "formats": [
                { "quality": "1080p", "height": 1080, "ext": "mp4", "filesize_bytes": 148161312, "tier": "full_hd", "token": null, "h264": true },
                { "quality": "720p", "height": 720, "ext": "mp4", "filesize_bytes": 31095584, "tier": "free", "token": "<token>", "h264": true },
                { "quality": "360p", "height": 360, "ext": "mp4", "filesize_bytes": 11889488, "tier": "free", "token": "<token>", "h264": true },
                { "quality": "270p", "height": 270, "ext": "mp4", "filesize_bytes": 3658304, "tier": "free", "token": "<token>", "h264": true }
            ]
        })
    );
}

#[tokio::test]
async fn a_facebook_reel_offers_its_sizeless_hd_and_sd() {
    let (router, _) = app(unused_pool(), Limits::default());
    let url = "https://www.facebook.com/reel/facebook";
    let (status, mut info) = status_and_body(info_for(&router, url).await).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(verified_format_ids(&mut info, url), ["hd", "sd"]);
    assert_eq!(
        info,
        json!({
            "platform": "facebook",
            "title": "Reel",
            "author": null,
            "thumbnail": null,
            "duration_seconds": 13,
            "free": {
                "height": 0,
                "filesize_bytes": null,
                "token": "<token>",
                "available_at": "<available_at>",
                "wait_seconds": 30,
                "expires_in_seconds": 930
            },
            "full_hd_available": false,
            "formats": [
                { "quality": "HD", "height": 0, "ext": "mp4", "filesize_bytes": null, "tier": "free", "token": "<token>", "h264": true },
                { "quality": "SD", "height": 0, "ext": "mp4", "filesize_bytes": null, "tier": "free", "token": "<token>", "h264": true }
            ]
        })
    );
}

#[tokio::test]
async fn a_url_that_is_not_plain_https_or_a_bad_body_is_an_invalid_url() {
    let (router, _) = app(unused_pool(), Limits::default());
    let oversized = json!({ "url": format!("https://x.com/{}", "a".repeat(5 * 1024)) });
    let bodies = [
        json!({ "url": "http://x.com/nowvi/status/1" }).to_string(),
        json!({ "url": "https://user@x.com/nowvi/status/1" }).to_string(),
        json!({ "url": "https://x.com:8443/nowvi/status/1" }).to_string(),
        json!({ "link": "https://x.com/nowvi/status/1" }).to_string(),
        "not json".to_owned(),
        oversized.to_string(),
    ];
    for body in bodies {
        let response = post_info(&router, body.clone(), CLIENT_IP).await;
        assert_eq!(
            status_and_body(response).await,
            error(StatusCode::BAD_REQUEST, "invalid_url"),
            "{}",
            &body[..body.len().min(60)]
        );
    }
    let without_content_type = Request::post("/api/info")
        .header("x-real-ip", CLIENT_IP)
        .body(Body::from(json!({ "url": "https://x.com/a" }).to_string()))
        .expect("a valid request");
    assert_eq!(
        status_and_body(send(&router, without_content_type).await).await,
        error(StatusCode::BAD_REQUEST, "invalid_url")
    );
}

#[tokio::test]
async fn a_host_outside_the_list_is_unsupported_and_instagram_is_paused() {
    let (router, _) = app(unused_pool(), Limits::default());
    for url in [
        "https://instagram.com.evil.com/reel/1",
        "https://youtube.com/watch?v=1",
    ] {
        assert_eq!(
            status_and_body(info_for(&router, url).await).await,
            error(StatusCode::UNPROCESSABLE_ENTITY, "unsupported_platform"),
            "{url}"
        );
    }
    assert_eq!(
        status_and_body(info_for(&router, "https://www.instagram.com/reel/1").await).await,
        error(StatusCode::SERVICE_UNAVAILABLE, "platform_unavailable")
    );
}

#[tokio::test]
async fn a_video_over_15_minutes_is_too_long() {
    let (router, _) = app(unused_pool(), Limits::default());
    let url = "https://www.tiktok.com/@scout2015/video/long";
    assert_eq!(
        status_and_body(info_for(&router, url).await).await,
        error(StatusCode::UNPROCESSABLE_ENTITY, "too_long")
    );
}

#[tokio::test]
async fn a_private_post_or_one_with_only_dash_formats_is_not_found() {
    let (router, _) = app(unused_pool(), Limits::default());
    for url in [
        "https://www.tiktok.com/@scout2015/video/private",
        "https://www.facebook.com/reel/dash",
    ] {
        assert_eq!(
            status_and_body(info_for(&router, url).await).await,
            error(StatusCode::NOT_FOUND, "not_found"),
            "{url}"
        );
    }
}

#[tokio::test]
async fn a_failing_yt_dlp_or_a_page_outside_the_allowlist_is_an_extract_failure() {
    let (router, state) = app(unused_pool(), Limits::default());
    for fake_reply in ["broken", "notjson", "flood", "offsite"] {
        let url = format!("https://www.tiktok.com/@scout2015/video/{fake_reply}");
        assert_eq!(
            status_and_body(info_for(&router, &url).await).await,
            error(StatusCode::BAD_GATEWAY, "extract_failed"),
            "{fake_reply}"
        );
    }
    assert!(all_slots_free(&state));
}

#[tokio::test(start_paused = true)]
async fn a_probe_past_25_seconds_is_an_extract_failure() {
    let (router, state) = app(unused_pool(), Limits::default());
    let url = "https://www.tiktok.com/@scout2015/video/hang";
    assert_eq!(
        status_and_body(info_for(&router, url).await).await,
        error(StatusCode::BAD_GATEWAY, "extract_failed")
    );
    assert!(all_slots_free(&state));
}

#[tokio::test]
async fn a_third_job_from_the_same_client_is_busy_while_another_client_still_gets_in() {
    let (router, state) = app(
        unused_pool(),
        Limits {
            max_jobs: 6,
            ..Limits::default()
        },
    );
    let hanging_url = "https://www.tiktok.com/@scout2015/video/hang";
    let in_flight: Vec<_> = (0..2)
        .map(|_| {
            let router = router.clone();
            tokio::spawn(async move { info_for(&router, hanging_url).await })
        })
        .collect();
    assert!(eventually(|| state.jobs.available_permits() == 4).await);

    assert_eq!(
        status_and_body(info_for(&router, hanging_url).await).await,
        error(StatusCode::SERVICE_UNAVAILABLE, "busy")
    );
    let other_client = post_info(
        &router,
        json!({ "url": "https://www.tiktok.com/@scout2015/video/tiktok" }).to_string(),
        "198.51.100.9",
    )
    .await;
    assert_eq!(other_client.status(), StatusCode::OK);

    for request in &in_flight {
        request.abort();
    }
    assert!(eventually(|| all_slots_free(&state)).await);
}

#[tokio::test]
async fn past_the_burst_a_client_is_rate_limited_with_retry_after() {
    let (router, _) = app(unused_pool(), Limits::default());
    for _ in 0..10 {
        let response = info_for(&router, "http://x.com/nowvi/status/1").await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }
    let response = info_for(&router, "http://x.com/nowvi/status/1").await;
    assert_eq!(response.headers()[RETRY_AFTER], "3");
    assert_eq!(
        status_and_body(response).await,
        error(StatusCode::TOO_MANY_REQUESTS, "rate_limited")
    );
}
