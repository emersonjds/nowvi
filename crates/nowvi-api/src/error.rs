use axum::Json;
use axum::http::StatusCode;
use axum::http::header::RETRY_AFTER;
use axum::response::{IntoResponse, Response};

/// Every error leaves as `{"error": "<code>"}`; the web maps the code to a fixed text.
#[derive(Debug, PartialEq)]
pub enum AppError {
    InvalidUrl,
    UnsupportedPlatform,
    NotFound,
    RateLimited { retry_after: u64 },
    ExtractFailed,
    Busy,
    InvalidToken,
    TooEarly,
    Expired,
    PaymentsDisabled,
}

impl AppError {
    fn status_and_code(&self) -> (StatusCode, &'static str) {
        match self {
            AppError::InvalidUrl => (StatusCode::BAD_REQUEST, "invalid_url"),
            AppError::UnsupportedPlatform => {
                (StatusCode::UNPROCESSABLE_ENTITY, "unsupported_platform")
            }
            AppError::NotFound => (StatusCode::NOT_FOUND, "not_found"),
            AppError::RateLimited { .. } => (StatusCode::TOO_MANY_REQUESTS, "rate_limited"),
            AppError::ExtractFailed => (StatusCode::BAD_GATEWAY, "extract_failed"),
            AppError::Busy => (StatusCode::SERVICE_UNAVAILABLE, "busy"),
            AppError::InvalidToken => (StatusCode::UNAUTHORIZED, "invalid_token"),
            AppError::TooEarly => (StatusCode::TOO_EARLY, "too_early"),
            AppError::Expired => (StatusCode::GONE, "expired"),
            AppError::PaymentsDisabled => (StatusCode::SERVICE_UNAVAILABLE, "payments_disabled"),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code) = self.status_and_code();
        let mut response = (status, Json(serde_json::json!({ "error": code }))).into_response();
        if let AppError::RateLimited { retry_after } = self {
            response
                .headers_mut()
                .insert(RETRY_AFTER, retry_after.into());
        }
        response
    }
}
