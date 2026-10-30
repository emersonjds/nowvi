use std::process::Stdio;
use std::time::Duration;

use serde::Deserialize;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, ChildStderr, Command};

use crate::error::AppError;

pub const TIMEOUT: Duration = Duration::from_secs(25);

const FREE_FORMAT: &str = "best[height<=720][ext=mp4][vcodec!=none][acodec!=none]/best[height<=720][vcodec!=none][acodec!=none]/best[height<=720]";

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
    pub title: Option<String>,
    pub uploader: Option<String>,
    pub channel: Option<String>,
    pub creator: Option<String>,
    pub thumbnail: Option<String>,
    pub duration: Option<f64>,
    pub height: Option<f64>,
    pub filesize: Option<f64>,
    pub filesize_approx: Option<f64>,
    #[serde(default)]
    pub formats: Vec<Format>,
}

#[derive(Debug, Deserialize)]
pub struct Format {
    pub height: Option<f64>,
}

/// `yt-dlp -J` with the free format; dropped on timeout, which kills the child.
pub async fn probe(bin: &str, url: &str) -> Result<Probe, AppError> {
    let child = Command::new(bin)
        .args([
            "-J",
            "--no-playlist",
            "--no-warnings",
            "-f",
            FREE_FORMAT,
            "--",
            url,
        ])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|error| {
            tracing::error!(%error, bin, "yt-dlp did not start");
            AppError::ExtractFailed
        })?;
    let output = match tokio::time::timeout(TIMEOUT, child.wait_with_output()).await {
        Ok(Ok(output)) => output,
        Ok(Err(error)) => {
            tracing::error!(%error, "yt-dlp wait failed");
            return Err(AppError::ExtractFailed);
        }
        Err(_) => {
            tracing::warn!(url, "yt-dlp probe timed out");
            return Err(AppError::ExtractFailed);
        }
    };
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        tracing::warn!(url, status = %output.status, stderr = %stderr.trim(), "yt-dlp probe failed");
        let lower = stderr.to_lowercase();
        if NOT_FOUND_HINTS.iter().any(|hint| lower.contains(hint)) {
            return Err(AppError::NotFound);
        }
        return Err(AppError::ExtractFailed);
    }
    serde_json::from_slice(&output.stdout).map_err(|error| {
        tracing::error!(%error, url, "yt-dlp printed JSON the API cannot read");
        AppError::ExtractFailed
    })
}

/// `yt-dlp -f <format_id> -o -`: the caller streams stdout; stderr goes to the log.
pub fn stream(bin: &str, url: &str, format_id: &str) -> Result<Child, AppError> {
    let mut child = Command::new(bin)
        .args([
            "-f",
            format_id,
            "--no-playlist",
            "--quiet",
            "--no-warnings",
            "-o",
            "-",
            "--",
            url,
        ])
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|error| {
            tracing::error!(%error, bin, "yt-dlp did not start");
            AppError::ExtractFailed
        })?;
    if let Some(stderr) = child.stderr.take() {
        tokio::spawn(log_lines(stderr));
    }
    Ok(child)
}

async fn log_lines(stderr: ChildStderr) {
    let mut lines = BufReader::new(stderr).lines();
    while let Ok(Some(line)) = lines.next_line().await {
        tracing::warn!(stderr = %line, "yt-dlp download");
    }
}
