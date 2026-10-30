use std::io;
use std::process::Stdio;
use std::time::Duration;

use serde::Deserialize;
use tokio::io::AsyncReadExt;
use tokio::process::{Child, ChildStderr, Command};
use url::Url;

use crate::error::AppError;

pub const TIMEOUT: Duration = Duration::from_secs(25);
const STDOUT_CAP: u64 = 2 * 1024 * 1024;
const STDERR_CAP: u64 = 8 * 1024;
const STDERR_LINES: usize = 200;

/// Both calls: only the 4 extractors, and nothing from the host's config, plugins or cache.
const COMMON_ARGS: [&str; 7] = [
    "--ignore-config",
    "--no-plugin-dirs",
    "--no-cache-dir",
    "--use-extractors",
    "instagram,tiktok,twitter,facebook",
    "--no-playlist",
    "--no-warnings",
];

/// The spec's 720p ladder, capped on the short side: a vertical 720x1280 reel caps on width.
/// Each step tries H.264 first: HEVC does not play on part of the Androids nor in WhatsApp.
const FREE_FORMAT: &str = concat!(
    "best[height<=720][aspect_ratio>=1][ext=mp4][vcodec^=avc][acodec!=none]/",
    "best[height<=720][aspect_ratio>=1][ext=mp4][vcodec!=none][acodec!=none]/",
    "best[width<=720][aspect_ratio<1][ext=mp4][vcodec^=avc][acodec!=none]/",
    "best[width<=720][aspect_ratio<1][ext=mp4][vcodec!=none][acodec!=none]/",
    "best[height<=720][aspect_ratio>=1][vcodec^=avc][acodec!=none]/",
    "best[height<=720][aspect_ratio>=1][vcodec!=none][acodec!=none]/",
    "best[width<=720][aspect_ratio<1][vcodec^=avc][acodec!=none]/",
    "best[width<=720][aspect_ratio<1][vcodec!=none][acodec!=none]/",
    "best[height<=720][aspect_ratio>=1][vcodec^=avc]/",
    "best[height<=720][aspect_ratio>=1]/",
    "best[width<=720][aspect_ratio<1][vcodec^=avc]/",
    "best[width<=720][aspect_ratio<1]",
);

/// What yt-dlp prints on stderr for a private, deleted or video-less post.
const NOT_FOUND_HINTS: [&str; 5] = [
    "private",
    "not available",
    "no video formats",
    "unsupported url",
    "login required",
];

/// The fields of `yt-dlp -J` the API reads.
#[derive(Debug, Deserialize)]
pub struct Probe {
    pub format_id: Option<String>,
    pub ext: Option<String>,
    pub webpage_url: Option<String>,
    pub title: Option<String>,
    pub uploader: Option<String>,
    pub channel: Option<String>,
    pub creator: Option<String>,
    pub thumbnail: Option<String>,
    pub duration: Option<f64>,
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub filesize: Option<f64>,
    pub filesize_approx: Option<f64>,
    #[serde(default)]
    pub formats: Vec<Format>,
}

#[derive(Debug, Deserialize)]
pub struct Format {
    pub width: Option<f64>,
    pub height: Option<f64>,
}

/// The quality a video is sold by: 720p and 1080p name the short side.
pub fn short_side(width: Option<f64>, height: Option<f64>) -> Option<f64> {
    match (width, height) {
        (Some(width), Some(height)) => Some(width.min(height)),
        _ => height,
    }
}

/// No shell, a clean env (`PATH` and `HOME=/tmp`) and the URL after `--`.
fn spawn(bin: &str, args: &[&str], url: &Url) -> Result<Child, AppError> {
    let mut command = Command::new(bin);
    command.env_clear().env("HOME", "/tmp");
    if let Some(path) = std::env::var_os("PATH") {
        command.env("PATH", path);
    }
    command
        .args(COMMON_ARGS)
        .args(args)
        .arg("--")
        .arg(url.as_str())
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|error| {
            tracing::error!(%error, bin, "yt-dlp did not start");
            AppError::ExtractFailed
        })
}

/// Keeps the first `STDERR_CAP` bytes and drains the rest, so the child never blocks on the pipe.
async fn read_capped(mut stderr: ChildStderr) -> io::Result<Vec<u8>> {
    let mut kept = Vec::new();
    (&mut stderr)
        .take(STDERR_CAP)
        .read_to_end(&mut kept)
        .await?;
    tokio::io::copy(&mut stderr, &mut tokio::io::sink()).await?;
    Ok(kept)
}

/// stderr can carry the URL and the post's text, so it stays at `debug`.
fn log_stderr(what: &str, platform: &str, url: &Url, stderr: &[u8]) {
    let text = String::from_utf8_lossy(stderr);
    let head = text
        .lines()
        .take(STDERR_LINES)
        .collect::<Vec<_>>()
        .join("\n");
    tracing::debug!(platform, host = url.host_str(), stderr = %head, "{what}");
}

/// `yt-dlp -J` with the free format; dropped on timeout, which kills the child.
pub async fn probe(bin: &str, url: &Url, platform: &str) -> Result<Probe, AppError> {
    let mut child = spawn(bin, &["-J", "--flat-playlist", "-f", FREE_FORMAT], url)?;
    let (Some(stdout), Some(stderr)) = (child.stdout.take(), child.stderr.take()) else {
        return Err(AppError::ExtractFailed);
    };
    let run = async {
        let read_stdout = async move {
            let mut json = Vec::new();
            stdout.take(STDOUT_CAP + 1).read_to_end(&mut json).await?;
            if json.len() as u64 > STDOUT_CAP {
                return Err(io::Error::other("stdout passed 2 MiB"));
            }
            Ok(json)
        };
        let (json, stderr) = tokio::try_join!(read_stdout, read_capped(stderr))?;
        Ok::<_, io::Error>((child.wait().await?, json, stderr))
    };
    let (status, json, stderr) = match tokio::time::timeout(TIMEOUT, run).await {
        Ok(Ok(done)) => done,
        Ok(Err(error)) => {
            tracing::warn!(%error, "yt-dlp probe output unreadable");
            return Err(AppError::ExtractFailed);
        }
        Err(_) => {
            tracing::warn!("yt-dlp probe timed out");
            return Err(AppError::ExtractFailed);
        }
    };
    if !status.success() {
        log_stderr("yt-dlp probe stderr", platform, url, &stderr);
        let lower = String::from_utf8_lossy(&stderr).to_lowercase();
        let no_free_format = lower.contains("requested format is not available");
        let error = if !no_free_format && NOT_FOUND_HINTS.iter().any(|hint| lower.contains(hint)) {
            AppError::NotFound
        } else {
            AppError::ExtractFailed
        };
        tracing::warn!(?error, %status, "yt-dlp probe failed");
        return Err(error);
    }
    serde_json::from_slice(&json).map_err(|error| {
        tracing::debug!(%error, "yt-dlp JSON parse error");
        tracing::warn!("yt-dlp printed JSON the API cannot read");
        AppError::ExtractFailed
    })
}

/// `yt-dlp -f <format_id> -o -`: the caller streams stdout; stderr goes to the `debug` log.
pub fn stream(bin: &str, url: &Url, platform: &str, format_id: &str) -> Result<Child, AppError> {
    let mut child = spawn(
        bin,
        &[
            "-f",
            format_id,
            "--max-filesize",
            "500M",
            "--quiet",
            "-o",
            "-",
        ],
        url,
    )?;
    if let Some(stderr) = child.stderr.take() {
        let (url, platform) = (url.clone(), platform.to_owned());
        tokio::spawn(async move {
            if let Ok(stderr) = read_capped(stderr).await
                && !stderr.is_empty()
            {
                log_stderr("yt-dlp download stderr", &platform, &url, &stderr);
            }
        });
    }
    Ok(child)
}
