mod allowlist;
mod ytdlp;

use axum::Json;
use axum::body::{Body, Bytes};
use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::{Query, State};
use axum::http::header::{CACHE_CONTROL, CONTENT_DISPOSITION, CONTENT_TYPE};
use axum::response::{IntoResponse, Response};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use tokio::process::Child;
use tokio::sync::OwnedSemaphorePermit;
use tokio_util::io::ReaderStream;

use crate::AppState;
use crate::error::AppError;
use crate::token::{self, Claims};

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
}

#[derive(Serialize)]
pub struct Free {
    height: u32,
    filesize_bytes: Option<u64>,
    token: String,
    available_at: u64,
}

fn job_slot(state: &AppState) -> Result<OwnedSemaphorePermit, AppError> {
    state
        .jobs
        .clone()
        .try_acquire_owned()
        .map_err(|_| AppError::Busy)
}

pub async fn info(
    State(state): State<AppState>,
    body: Result<Json<InfoRequest>, JsonRejection>,
) -> Result<Json<InfoResponse>, AppError> {
    let Json(request) = body.map_err(|_| AppError::InvalidUrl)?;
    let (url, platform) = allowlist::check(&request.url)?;
    let probe = {
        let _slot = job_slot(&state)?;
        ytdlp::probe(&state.config.ytdlp_bin, url.as_str()).await?
    };
    let format_id = probe.format_id.ok_or_else(|| {
        tracing::warn!(%url, "yt-dlp resolved no format");
        AppError::NotFound
    })?;
    let available_at = token::now() + state.config.ad_wait_seconds;
    let token = token::sign(
        &state.config.token_secret,
        &Claims {
            u: url.to_string(),
            p: platform.into(),
            f: format_id,
            nbf: available_at,
            exp: available_at + token::LIFETIME_SECONDS,
        },
    );
    Ok(Json(InfoResponse {
        platform,
        title: probe.title.unwrap_or_default(),
        author: probe.uploader.or(probe.channel).or(probe.creator),
        thumbnail: probe.thumbnail,
        duration_seconds: probe.duration.map_or(0, |seconds| seconds.round() as u64),
        free: Free {
            height: ytdlp::short_side(probe.width, probe.height).map_or(0, |side| side as u32),
            filesize_bytes: probe
                .filesize
                .or(probe.filesize_approx)
                .map(|bytes| bytes as u64),
            token,
            available_at,
        },
        full_hd_available: probe.formats.iter().any(|format| {
            ytdlp::short_side(format.width, format.height).is_some_and(|side| side >= 1080.0)
        }),
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
    _slot: OwnedSemaphorePermit,
    pool: PgPool,
    platform: String,
}

pub async fn download(
    State(state): State<AppState>,
    query: Result<Query<DownloadQuery>, QueryRejection>,
) -> Result<Response, AppError> {
    let Query(query) = query.map_err(|_| AppError::InvalidToken)?;
    let claims = token::verify(&state.config.token_secret, &query.token, token::now())?;
    let slot = job_slot(&state)?;
    let mut child = ytdlp::stream(&state.config.ytdlp_bin, &claims.u, &claims.f)?;
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
            tracing::warn!(url = %claims.u, "yt-dlp ended without bytes");
            return Err(AppError::ExtractFailed);
        }
        Err(_) => {
            tracing::warn!(url = %claims.u, "yt-dlp download timed out before the first byte");
            return Err(AppError::ExtractFailed);
        }
    };
    let filename = format!("nowvi-{}-{}.mp4", claims.p, token::now());
    let job = Job {
        first: Some(first),
        stdout,
        child,
        _slot: slot,
        pool: state.pool.clone(),
        platform: claims.p,
    };
    let body = futures_util::stream::unfold(job, |mut job| async move {
        if let Some(chunk) = job.first.take() {
            return Some((Ok(chunk), job));
        }
        match job.stdout.next().await {
            Some(chunk) => Some((chunk, job)),
            None => {
                finish(job).await;
                None
            }
        }
    });
    Ok((
        [
            (CONTENT_TYPE, "video/mp4".to_string()),
            (
                CONTENT_DISPOSITION,
                format!("attachment; filename=\"{filename}\""),
            ),
            (CACHE_CONTROL, "no-store".to_string()),
        ],
        Body::from_stream(body),
    )
        .into_response())
}

/// stdout closed: a clean exit counts as a download; a failed insert is only logged.
async fn finish(mut job: Job) {
    match job.child.wait().await {
        Ok(status) if status.success() => {
            tokio::spawn(crate::db::record_download(job.pool, job.platform));
        }
        Ok(status) => tracing::warn!(%status, "yt-dlp download exited with an error"),
        Err(error) => tracing::error!(%error, "yt-dlp download wait failed"),
    }
}
