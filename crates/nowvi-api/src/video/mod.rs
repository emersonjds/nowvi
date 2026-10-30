mod allowlist;
#[cfg(test)]
mod download_tests;
#[cfg(test)]
mod info_tests;
mod ytdlp;

use std::io;
use std::time::Duration;

use axum::Json;
use axum::body::{Body, Bytes};
use axum::extract::rejection::{JsonRejection, QueryRejection};
use axum::extract::{Extension, Query, State};
use axum::http::header::{
    CACHE_CONTROL, CONTENT_DISPOSITION, CONTENT_TYPE, HeaderName, X_CONTENT_TYPE_OPTIONS,
};
use axum::response::{IntoResponse, Redirect, Response};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use tokio::process::{Child, ChildStdout};
use tokio::sync::{OwnedSemaphorePermit, mpsc};
use tokio::time::Instant;
use tokio_util::io::ReaderStream;
use url::Url;

use crate::AppState;
use crate::error::AppError;
use crate::rate_limit::{ClientIp, JobGuard};
use crate::token::{self, Claims};
use ytdlp::{Pick, Probe, Tier};

const EXIT_TIMEOUT: Duration = Duration::from_secs(5);
/// The body's queue: a client that stops reading stalls the queue, never the watchdog.
const QUEUED_CHUNKS: usize = 8;
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
    ensure_page_in_allowlist(&probe, platform)?;
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
            format_item(
                pick,
                &state.config.token_secret,
                &url,
                platform,
                available_at,
            )
        })
        .collect();
    let free = free_offer(&formats, available_at, wait_seconds, platform)?;
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

fn ensure_page_in_allowlist(probe: &Probe, platform: &str) -> Result<(), AppError> {
    let resolved_page = probe.webpage_url.as_deref().map(allowlist::check);
    if resolved_page.is_none_or(|checked| checked.is_err()) {
        tracing::warn!(platform, "yt-dlp resolved a page outside the allowlist");
        return Err(AppError::ExtractFailed);
    }
    Ok(())
}

/// The extension names the downloaded file and picks its `Content-Type`.
fn header_safe_ext(ext: String) -> String {
    let is_safe =
        (1..=5).contains(&ext.len()) && ext.bytes().all(|byte| byte.is_ascii_alphanumeric());
    if is_safe { ext } else { "bin".into() }
}

fn format_item(
    pick: Pick,
    token_secret: &[u8],
    url: &Url,
    platform: &str,
    available_at: u64,
) -> FormatItem {
    let ext = header_safe_ext(pick.ext);
    let token = (pick.tier == Tier::Free).then(|| {
        token::sign(
            token_secret,
            &Claims {
                url: url.to_string(),
                platform: platform.into(),
                format_id: pick.format_id,
                ext: ext.clone(),
                quality: pick.quality.clone(),
                nbf: available_at,
                exp: available_at + token::LIFETIME_SECONDS,
            },
        )
    });
    FormatItem {
        quality: pick.quality,
        height: pick.height,
        ext,
        filesize_bytes: pick.filesize_bytes,
        tier: pick.tier,
        token,
        h264: pick.h264,
    }
}

fn free_offer(
    formats: &[FormatItem],
    available_at: u64,
    wait_seconds: u64,
    platform: &str,
) -> Result<Free, AppError> {
    let Some(first_free) = formats.iter().find(|format| format.tier == Tier::Free) else {
        tracing::warn!(platform, "yt-dlp listed no progressive format up to 720p");
        return Err(AppError::NotFound);
    };
    Ok(Free {
        height: first_free.height,
        filesize_bytes: first_free.filesize_bytes,
        token: first_free.token.clone().unwrap_or_default(),
        available_at,
        wait_seconds,
        expires_in_seconds: wait_seconds + token::LIFETIME_SECONDS,
    })
}

#[derive(Deserialize)]
pub struct DownloadQuery {
    token: String,
}

/// Owned by the download's watchdog task: a client that stops reading never holds the child or
/// the slot past the idle timeout or the deadline.
struct Job {
    stdout: ReaderStream<ChildStdout>,
    child: Child,
    _slot: Slot,
    pool: PgPool,
    platform: String,
    quality: String,
    deadline: Instant,
    idle_timeout: Duration,
}

/// A browser navigation: a failure goes back to the page as `/?erro=<code>`, never as JSON.
pub async fn download(
    State(state): State<AppState>,
    Extension(client): Extension<ClientIp>,
    query: Result<Query<DownloadQuery>, QueryRejection>,
) -> Response {
    match stream(&state, client, query).await {
        Ok(response) => response,
        Err(error) => back_to_page(&state, &error),
    }
}

/// `303 <first WEB_ORIGIN>/?erro=<code>`: the page shows the fixed text for the code.
pub fn back_to_page(state: &AppState, error: &AppError) -> Response {
    let origin = state
        .config
        .web_origins
        .first()
        .and_then(|origin| origin.to_str().ok())
        .unwrap_or_default()
        .trim_end_matches('/');
    Redirect::to(&format!("{origin}/?erro={}", error.code())).into_response()
}

async fn stream(
    state: &AppState,
    client: ClientIp,
    query: Result<Query<DownloadQuery>, QueryRejection>,
) -> Result<Response, AppError> {
    let deadline = Instant::now() + state.config.stream_deadline;
    let Query(query) = query.map_err(|_| AppError::InvalidToken)?;
    let claims = token::verify(&state.config.token_secret, &query.token, token::now())?;
    let url = Url::parse(&claims.url).map_err(|_| AppError::InvalidToken)?;
    let slot = job_slot(state, client)?;
    let mut child = ytdlp::stream(
        &state.config.ytdlp_bin,
        &url,
        &claims.platform,
        &claims.format_id,
    )?;
    let Some(stdout) = child.stdout.take() else {
        return Err(AppError::ExtractFailed);
    };
    let mut stdout = ReaderStream::new(stdout);
    let first = first_chunk(&mut stdout, &claims.platform).await?;
    let headers = attachment_headers(&claims.platform, &claims.ext);
    let job = Job {
        stdout,
        child,
        _slot: slot,
        pool: state.pool.clone(),
        platform: claims.platform,
        quality: claims.quality,
        deadline,
        idle_timeout: state.config.stream_idle_timeout,
    };
    let (chunks, mut delivered) = mpsc::channel(QUEUED_CHUNKS);
    tokio::spawn(watchdog(job, chunks));
    let body = futures_util::stream::once(std::future::ready(Ok(first))).chain(
        futures_util::stream::poll_fn(move |context| delivered.poll_recv(context)),
    );
    Ok((headers, Body::from_stream(body)).into_response())
}

/// The first chunk proves yt-dlp got the video; before it, a failure can still be a 502.
async fn first_chunk(
    stdout: &mut ReaderStream<ChildStdout>,
    platform: &str,
) -> Result<Bytes, AppError> {
    match tokio::time::timeout(ytdlp::TIMEOUT, stdout.next()).await {
        Ok(Some(Ok(chunk))) => Ok(chunk),
        Ok(Some(Err(error))) => {
            tracing::error!(%error, "reading yt-dlp stdout failed");
            Err(AppError::ExtractFailed)
        }
        Ok(None) => {
            tracing::warn!(platform, "yt-dlp ended without bytes");
            Err(AppError::ExtractFailed)
        }
        Err(_) => {
            tracing::warn!(platform, "yt-dlp download timed out before the first byte");
            Err(AppError::ExtractFailed)
        }
    }
}

fn attachment_headers(platform: &str, ext: &str) -> [(HeaderName, String); 4] {
    let filename = format!("nowvi-{platform}-{}.{ext}", token::now());
    let content_type = match ext {
        "mp4" => "video/mp4",
        "webm" => "video/webm",
        _ => "application/octet-stream",
    };
    [
        (CONTENT_TYPE, content_type.to_string()),
        (
            CONTENT_DISPOSITION,
            format!("attachment; filename=\"{filename}\""),
        ),
        (CACHE_CONTROL, "no-store".to_string()),
        (X_CONTENT_TYPE_OPTIONS, "nosniff".to_string()),
    ]
}

fn timed_out(message: &'static str) -> io::Error {
    io::Error::new(io::ErrorKind::TimedOut, message)
}

fn client_left() -> io::Error {
    io::ErrorKind::ConnectionAborted.into()
}

async fn watchdog(mut job: Job, chunks: mpsc::Sender<io::Result<Bytes>>) {
    // Held back from the start: a full queue must still have room for the error that ends the body.
    let Ok(last_message) = chunks.clone().reserve_owned().await else {
        return stop(&mut job.child).await;
    };
    match feed_body(&mut job, &chunks).await {
        Ok(()) => finish(job).await,
        Err(error) => {
            if error.kind() == io::ErrorKind::ConnectionAborted {
                tracing::info!(platform = job.platform, "client left the download");
            } else {
                tracing::warn!(platform = job.platform, %error, "yt-dlp download stopped");
            }
            last_message.send(Err(error));
            stop(&mut job.child).await;
        }
    }
}

/// Feeds stdout to the body until the first of: the end of stdout, the client gone, no chunk
/// moving for `idle_timeout`, or the deadline.
async fn feed_body(job: &mut Job, chunks: &mpsc::Sender<io::Result<Bytes>>) -> io::Result<()> {
    let mut idle_deadline = Instant::now() + job.idle_timeout;
    loop {
        tokio::select! {
            _ = tokio::time::sleep_until(job.deadline) => {
                return Err(timed_out("the download ran out of time"));
            }
            _ = tokio::time::sleep_until(idle_deadline) => {
                return Err(timed_out("no chunk moved for the idle timeout"));
            }
            _ = chunks.closed() => return Err(client_left()),
            next = next_chunk(chunks, &mut job.stdout) => match next {
                Some((queue_slot, Some(Ok(chunk)))) => {
                    queue_slot.send(Ok(chunk));
                    idle_deadline = Instant::now() + job.idle_timeout;
                }
                Some((_, Some(Err(error)))) => return Err(error),
                Some((_, None)) => return Ok(()),
                None => return Err(client_left()),
            },
        }
    }
}

/// Room in the body's queue first, then the next stdout chunk; `None` once the body is gone.
async fn next_chunk<'queue>(
    chunks: &'queue mpsc::Sender<io::Result<Bytes>>,
    stdout: &mut ReaderStream<ChildStdout>,
) -> Option<(
    mpsc::Permit<'queue, io::Result<Bytes>>,
    Option<io::Result<Bytes>>,
)> {
    let queue_slot = chunks.reserve().await.ok()?;
    Some((queue_slot, stdout.next().await))
}

async fn stop(child: &mut Child) {
    let _ = child.start_kill();
    if tokio::time::timeout(EXIT_TIMEOUT, child.wait())
        .await
        .is_err()
    {
        tracing::error!("yt-dlp did not exit after SIGKILL");
    }
}

/// stdout closed: a clean exit counts as a download; a failed insert is only logged.
async fn finish(mut job: Job) {
    let Ok(exit) = tokio::time::timeout(EXIT_TIMEOUT, job.child.wait()).await else {
        tracing::warn!(
            platform = job.platform,
            "yt-dlp kept running after stdout closed"
        );
        return stop(&mut job.child).await;
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
