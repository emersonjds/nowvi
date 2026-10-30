use axum::body::Body;
use axum::http::header::{
    ACCESS_CONTROL_ALLOW_ORIGIN, ACCESS_CONTROL_EXPOSE_HEADERS, CACHE_CONTROL,
    CONTENT_SECURITY_POLICY, ORIGIN, STRICT_TRANSPORT_SECURITY, X_CONTENT_TYPE_OPTIONS,
};
use axum::http::{Request, StatusCode};
use axum::response::Response;
use serde_json::json;

use crate::test_support::{CLIENT_IP, Limits, WEB_ORIGIN, app, json_body, send, unused_pool};

fn request(method: &str, path: &str) -> axum::http::request::Builder {
    Request::builder()
        .method(method)
        .uri(path)
        .header("x-real-ip", CLIENT_IP)
}

async fn health(origin: &str) -> Response {
    let (router, _) = app(unused_pool(), Limits::default());
    let request = request("GET", "/health")
        .header(ORIGIN, origin)
        .body(Body::empty())
        .expect("a valid request");
    send(&router, request).await
}

fn assert_security_headers(response: &Response) {
    let headers = response.headers();
    assert_eq!(headers[X_CONTENT_TYPE_OPTIONS], "nosniff");
    assert_eq!(headers[CACHE_CONTROL], "no-store");
    assert_eq!(
        headers[CONTENT_SECURITY_POLICY],
        "default-src 'none'; frame-ancestors 'none'"
    );
    assert_eq!(headers[STRICT_TRANSPORT_SECURITY], "max-age=31536000");
}

#[tokio::test]
async fn health_answers_ok_with_the_security_headers() {
    let response = health(WEB_ORIGIN).await;
    assert_eq!(response.status(), StatusCode::OK);
    assert_security_headers(&response);
    let body = axum::body::to_bytes(response.into_body(), 64)
        .await
        .expect("the whole body");
    assert_eq!(&body[..], b"ok");
}

#[tokio::test]
async fn a_json_error_and_a_303_carry_the_security_headers() {
    let (router, _) = app(unused_pool(), Limits::default());
    let order = request("POST", "/api/orders")
        .body(Body::empty())
        .expect("a valid request");
    let json_error = send(&router, order).await;
    assert_security_headers(&json_error);

    let download = request("GET", "/api/download?token=garbage")
        .body(Body::empty())
        .expect("a valid request");
    let redirect = send(&router, download).await;
    assert_eq!(redirect.status(), StatusCode::SEE_OTHER);
    assert_security_headers(&redirect);
}

#[tokio::test]
async fn orders_answer_payments_disabled() {
    let (router, _) = app(unused_pool(), Limits::default());
    let order = request("POST", "/api/orders")
        .body(Body::empty())
        .expect("a valid request");
    let response = send(&router, order).await;
    assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(
        json_body(response).await,
        json!({ "error": "payments_disabled" })
    );
}

#[tokio::test]
async fn cors_allows_web_origin_and_exposes_content_disposition() {
    let response = health(WEB_ORIGIN).await;
    let headers = response.headers();
    assert_eq!(headers[ACCESS_CONTROL_ALLOW_ORIGIN], WEB_ORIGIN);
    assert_eq!(
        headers[ACCESS_CONTROL_EXPOSE_HEADERS],
        "content-disposition"
    );
}

#[tokio::test]
async fn cors_ignores_an_unknown_origin() {
    let response = health("https://evil.example").await;
    assert!(!response.headers().contains_key(ACCESS_CONTROL_ALLOW_ORIGIN));
}
