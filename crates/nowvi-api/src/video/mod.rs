mod allowlist;
mod ytdlp;

use std::time::Duration;

use axum::Json;
use axum::body::{Body, Bytes};
use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::{Extension, Query, State};
use axum::http::header::{
    CACHE_CONTROL, CONTENT_DISPOSITION, CONTENT_TYPE, X_CONTENT_TYPE_OPTIONS,
};
use axum::response::{IntoResponse, Redirect, Response};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use tokio::process::Child;
use tokio::sync::OwnedSemaphorePermit;
use tokio::time::Instant;
use tokio_util::io::ReaderStream;
use url::Url;

use crate::AppState;
use crate::error::AppError;
use crate::rate_limit::{ClientIp, JobGuard};
use crate::token::{self, Claims};
use ytdlp::Tier;

/// The spec's stream limits: 30 s without a chunk ends it, and so do 10 min in total.
const CHUNK_TIMEOUT: Duration = Duration::from_secs(30);
const STREAM_DEADLINE: Duration = Duration::from_secs(10 * 60);
const EXIT_TIMEOUT: Duration = Duration::from_secs(5);
const MAX_DURATION_SECONDS: f64 = 15.0 * 60.0;

#[derive(Deserialize)]
pub struct InfoRequest {
    url: String,
}

#[derive(Serialize)]
pub struct InfoResponse {
    platform: &'static str,
    title: String,
    author: Option<String>,
    thumbnail: Option<String>,
    duration_seconds: u64,
    free: Free,
    full_hd_available: bool,
    formats: Vec<FormatItem>,
}

/// One row of the quality list; only `free` rows carry a token.
#[derive(Serialize)]
pub struct FormatItem {
    quality: String,
    height: u32,
    ext: String,
    filesize_bytes: Option<u64>,
    tier: Tier,
    token: Option<String>,
    h264: bool,
}

#[derive(Serialize)]
pub struct Free {
    height: u32,
    filesize_bytes: Option<u64>,
    token: String,
    available_at: u64,
    wait_seconds: u64,
    expires_in_seconds: u64,
}

/// A yt-dlp job: one of the client's two and one of the global semaphore.
struct Slot {
    _client: JobGuard,
    _permit: OwnedSemaphorePermit,
}

fn job_slot(state: &AppState, client: ClientIp) -> Result<Slot, AppError> {
    Ok(Slot {
        _client: state.limits.start_job(client)?,
        _permit: state
            .jobs
            .clone()
            .try_acquire_owned()
            .map_err(|_| AppError::Busy)?,
    })
}

// ponytail: hardcoded pause list; yt-dlp needs a login for Instagram since 2026-10 (NOWVI-20).
// Remove the entry when extraction works again.
const PAUSED_PLATFORMS: [&str; 1] = ["instagram"];

pub async fn info(
    State(state): State<AppState>,
    Extension(client): Extension<ClientIp>,
    body: Result<Json<InfoRequest>, JsonRejection>,
) -> Result<Json<InfoResponse>, AppError> {
    let Json(request) = body.map_err(|_| AppError::InvalidUrl)?;
    let (url, platform) = allowlist::check(&request.url)?;
    if PAUSED_PLATFORMS.contains(&platform) {
        return Err(AppError::PlatformUnavailable);
    }
    let probe = {
        let _slot = job_slot(&state, client)?;
        ytdlp::probe(&state.config.ytdlp_bin, &url, platform).await?
    };
    if probe
        .webpage_url
        .as_deref()
        .map(allowlist::check)
        .is_none_or(|checked| checked.is_err())
    {
        tracing::warn!(platform, "yt-dlp resolved a page outside the allowlist");
        return Err(AppError::ExtractFailed);
    }
    if probe
        .duration
        .is_some_and(|seconds| seconds > MAX_DURATION_SECONDS)
    {
        return Err(AppError::TooLong);
    }
    let wait_seconds = state.config.ad_wait_seconds;
    let available_at = token::now() + wait_seconds;
    let formats: Vec<FormatItem> = ytdlp::pick_formats(&probe.formats)
        .into_iter()
        .map(|pick| {
            // It names the file and picks the Content-Type; anything odd stays out of the headers.
            let ext = Some(pick.ext)
                .filter(|ext| {
                    (1..=5).contains(&ext.len()) && ext.bytes().all(|b| b.is_ascii_alphanumeric())
                })
                .unwrap_or_else(|| "bin".into());
            let quality = pick.quality.clone();
            let token = (pick.tier == Tier::Free).then(|| {
                token::sign(
                    &state.config.token_secret,
                    &Claims {
                        u: url.to_string(),
                        p: platform.into(),
                        f: pick.format_id,
                        e: ext.clone(),
                        q: quality.clone(),
                        nbf: available_at,
                        exp: available_at + token::LIFETIME_SECONDS,
                    },
                )
            });
            FormatItem {
                quality,
                height: pick.height,
                ext,
                filesize_bytes: pick.filesize_bytes,
                tier: pick.tier,
                token,
                h264: pick.h264,
            }
        })
        .collect();
    let Some(free) = formats.iter().find(|format| format.tier == Tier::Free) else {
        tracing::warn!(platform, "yt-dlp listed no progressive format up to 720p");
        return Err(AppError::NotFound);
    };
    let free = Free {
        height: free.height,
        filesize_bytes: free.filesize_bytes,
        token: free.token.clone().unwrap_or_default(),
        available_at,
        wait_seconds,
        expires_in_seconds: wait_seconds + token::LIFETIME_SECONDS,
    };
    Ok(Json(InfoResponse {
        platform,
        title: probe.title.unwrap_or_default(),
        author: probe.uploader.or(probe.channel).or(probe.creator),
        thumbnail: probe
            .thumbnail
            .filter(|thumbnail| thumbnail.starts_with("https://")),
        duration_seconds: probe.duration.map_or(0, |seconds| seconds.round() as u64),
        free,
        full_hd_available: formats.iter().any(|format| format.tier == Tier::FullHd),
        formats,
    }))
}

#[derive(Deserialize)]
pub struct DownloadQuery {
    token: String,
}

/// Owns the yt-dlp child and its job slot for as long as the body streams: a client that
/// disconnects drops the body, which kills the child and frees the slot.
struct Job {
    first: Option<Bytes>,
    stdout: ReaderStream<tokio::process::ChildStdout>,
    child: Child,
    _slot: Slot,
    pool: PgPool,
    platform: String,
    quality: String,
    deadline: Instant,
}

/// A browser navigation: a failure goes back to the page as `/?erro=<code>`, never as JSON.
pub async fn download(
    State(state): State<AppState>,
    Extension(client): Extension<ClientIp>,
    query: Result<Query<DownloadQuery>, QueryRejection>,
) -> Response {
    match stream(&state, client, query).await {
        Ok(response) => response,
        Err(error) => {
            let origin = state
                .config
                .web_origins
                .first()
                .and_then(|origin| origin.to_str().ok())
                .unwrap_or_default()
                .trim_end_matches('/');
            Redirect::to(&format!("{origin}/?erro={}", error.code())).into_response()
        }
    }
}

async fn stream(
    state: &AppState,
    client: ClientIp,
    query: Result<Query<DownloadQuery>, QueryRejection>,
) -> Result<Response, AppError> {
    let deadline = Instant::now() + STREAM_DEADLINE;
    let Query(query) = query.map_err(|_| AppError::InvalidToken)?;
    let claims = token::verify(&state.config.token_secret, &query.token, token::now())?;
    let url = Url::parse(&claims.u).map_err(|_| AppError::InvalidToken)?;
    let slot = job_slot(state, client)?;
    let mut child = ytdlp::stream(&state.config.ytdlp_bin, &url, &claims.p, &claims.f)?;
    let Some(stdout) = child.stdout.take() else {
        return Err(AppError::ExtractFailed);
    };
    let mut stdout = ReaderStream::new(stdout);
    // The first chunk proves yt-dlp got the video; before it, a failure can still be a 502.
    let first = match tokio::time::timeout(ytdlp::TIMEOUT, stdout.next()).await {
        Ok(Some(Ok(chunk))) => chunk,
        Ok(Some(Err(error))) => {
            tracing::error!(%error, "reading yt-dlp stdout failed");
            return Err(AppError::ExtractFailed);
        }
        Ok(None) => {
            tracing::warn!(platform = claims.p, "yt-dlp ended without bytes");
            return Err(AppError::ExtractFailed);
        }
        Err(_) => {
            tracing::warn!(
                platform = claims.p,
                "yt-dlp download timed out before the first byte"
            );
            return Err(AppError::ExtractFailed);
        }
    };
    let filename = format!("nowvi-{}-{}.{}", claims.p, token::now(), claims.e);
    let content_type = match claims.e.as_str() {
        "mp4" => "video/mp4",
        "webm" => "video/webm",
        _ => "application/octet-stream",
    };
    let job = Job {
        first: Some(first),
        stdout,
        child,
        _slot: slot,
        pool: state.pool.clone(),
        platform: claims.p,
        quality: claims.q,
        deadline,
    };
    // A `None` state ends the body; dropping the job kills the child and frees the slot.
    let body = futures_util::stream::unfold(Some(job), |job| async move {
        let mut job = job?;
        if let Some(chunk) = job.first.take() {
            return Some((Ok(chunk), Some(job)));
        }
        let until = job.deadline.min(Instant::now() + CHUNK_TIMEOUT);
        match tokio::time::timeout_at(until, job.stdout.next()).await {
            Ok(Some(Ok(chunk))) => Some((Ok(chunk), Some(job))),
            Ok(Some(Err(error))) => Some((Err(error), None)),
            Ok(None) => {
                finish(job).await;
                None
            }
            Err(_) => {
                tracing::warn!(
                    platform = job.platform,
                    "yt-dlp download stalled or ran out of time"
                );
                Some((Err(std::io::ErrorKind::TimedOut.into()), None))
            }
        }
    });
    Ok((
        [
            (CONTENT_TYPE, content_type.to_string()),
            (
                CONTENT_DISPOSITION,
                format!("attachment; filename=\"{filename}\""),
            ),
            (CACHE_CONTROL, "no-store".to_string()),
            (X_CONTENT_TYPE_OPTIONS, "nosniff".to_string()),
        ],
        Body::from_stream(body),
    )
        .into_response())
}

/// stdout closed: a clean exit counts as a download; a failed insert is only logged.
async fn finish(mut job: Job) {
    let Ok(exit) = tokio::time::timeout(EXIT_TIMEOUT, job.child.wait()).await else {
        tracing::warn!(
            platform = job.platform,
            "yt-dlp kept running after stdout closed"
        );
        let _ = job.child.kill().await;
        return;
    };
    match exit {
        Ok(status) if status.success() => {
            tokio::spawn(crate::db::record_download(
                job.pool,
                job.platform,
                job.quality,
            ));
        }
        Ok(status) => tracing::warn!(%status, "yt-dlp download exited with an error"),
        Err(error) => tracing::error!(%error, "yt-dlp download wait failed"),
    }
}
