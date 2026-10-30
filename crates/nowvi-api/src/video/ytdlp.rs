use std::collections::BTreeMap;
use std::io;
use std::process::{ExitStatus, Stdio};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tokio::io::AsyncReadExt;
use tokio::process::{Child, ChildStderr, ChildStdout, Command};
use url::Url;

use crate::error::AppError;

pub const TIMEOUT: Duration = Duration::from_secs(25);
const STDOUT_CAP: u64 = 2 * 1024 * 1024;
const STDERR_CAP: u64 = 8 * 1024;
const STDERR_LINES: usize = 200;

/// Both calls: only the 4 networks (share links `vm.tiktok`, `facebook:reel` and `instagram:story` included;
/// never `FacebookRedirectURL`, which follows `l.php?u=` anywhere), and nothing from the host's config, plugins or cache.
const COMMON_ARGS: [&str; 7] = [
    "--ignore-config",
    "--no-plugin-dirs",
    "--no-cache-dir",
    "--use-extractors",
    "instagram,instagram:story,tiktok,vm.tiktok,twitter,facebook,facebook:reel",
    "--no-playlist",
    "--no-warnings",
];

/// What yt-dlp prints on stderr for a private, deleted or video-less post.
const NOT_FOUND_HINTS: [&str; 5] = [
    "private",
    "not available",
    "no video formats",
    "unsupported url",
    "login required",
];

#[derive(Debug, Deserialize)]
pub struct Probe {
    pub webpage_url: Option<String>,
    pub title: Option<String>,
    pub uploader: Option<String>,
    pub channel: Option<String>,
    pub creator: Option<String>,
    pub thumbnail: Option<String>,
    pub duration: Option<f64>,
    #[serde(default)]
    pub formats: Vec<Format>,
}

#[derive(Debug, Deserialize)]
pub struct Format {
    pub format_id: Option<String>,
    pub ext: Option<String>,
    pub vcodec: Option<String>,
    pub acodec: Option<String>,
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub tbr: Option<f64>,
    pub filesize: Option<f64>,
    pub filesize_approx: Option<f64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Tier {
    Free,
    FullHd,
}

/// One quality the page offers: `height` is the short side.
#[derive(Debug, PartialEq)]
pub struct Pick {
    pub format_id: String,
    pub ext: String,
    pub height: u32,
    pub filesize_bytes: Option<u64>,
    pub tier: Tier,
    pub h264: bool,
    /// `"<height>p"`, or the extractor's own name (`HD`, `SD`) when it lists no size.
    pub quality: String,
}

/// H.264, or an mp4 with no codec listed (X's progressive files are H.264): what WhatsApp plays.
fn is_h264(format: &Format) -> bool {
    match format.vcodec.as_deref() {
        Some(codec) => codec.starts_with("avc") || codec.starts_with("h264"),
        None => format.ext.as_deref() == Some("mp4"),
    }
}

/// Progressive formats only, with a missing `acodec` counted in (part of X leaves it null): the
/// image has no ffmpeg to merge.
fn is_progressive(format: &Format) -> bool {
    format.format_id.is_some()
        && format.vcodec.as_deref() != Some("none")
        && format.acodec.as_deref() != Some("none")
}

fn is_mp4(format: &Format) -> bool {
    format.ext.as_deref() == Some("mp4")
}

fn preference(format: &Format) -> (bool, bool, f64) {
    (is_h264(format), is_mp4(format), format.tbr.unwrap_or(0.0))
}

fn filesize_bytes(format: &Format) -> Option<u64> {
    format
        .filesize
        .or(format.filesize_approx)
        .map(|bytes| bytes as u64)
}

/// Also returns the mp4 formats listed with no size (Facebook's `hd` and `sd`).
fn best_per_short_side(formats: &[Format]) -> (BTreeMap<u32, &Format>, Vec<&Format>) {
    let mut best: BTreeMap<u32, &Format> = BTreeMap::new();
    let mut sizeless = Vec::new();
    for format in formats.iter().filter(|format| is_progressive(format)) {
        let Some(side) = short_side(format.width, format.height) else {
            if is_mp4(format) {
                sizeless.push(format);
            }
            continue;
        };
        let kept = best.entry(side as u32).or_insert(format);
        if preference(format) > preference(kept) {
            *kept = format;
        }
    }
    (best, sizeless)
}

fn sized_pick(height: u32, format: &Format, tier: Tier) -> Pick {
    Pick {
        format_id: format.format_id.clone().unwrap_or_default(),
        ext: format.ext.clone().unwrap_or_default(),
        height,
        filesize_bytes: filesize_bytes(format),
        tier,
        h264: is_h264(format),
        quality: format!("{height}p"),
    }
}

fn sizeless_pick(format: &Format) -> Pick {
    let format_id = format.format_id.clone().unwrap_or_default();
    Pick {
        quality: format_id.to_uppercase(),
        format_id,
        ext: "mp4".to_owned(),
        height: 0,
        filesize_bytes: filesize_bytes(format),
        tier: Tier::Free,
        h264: is_h264(format),
    }
}

/// Up to 4 free (<= 720), largest first, after the single largest full HD (>= 1080).
pub fn pick_formats(formats: &[Format]) -> Vec<Pick> {
    let (best, mut sizeless) = best_per_short_side(formats);
    let full_hd = best
        .range(1080..)
        .next_back()
        .map(|(&height, format)| sized_pick(height, format, Tier::FullHd));
    let free = best
        .range(..=720)
        .rev()
        .map(|(&height, format)| sized_pick(height, format, Tier::Free));
    // ponytail: an sizeless `hd` may be 1080p and still ships free; tier it once yt-dlp sizes it.
    sizeless.sort_by_key(|format| format.format_id.as_deref() != Some("hd"));
    let sizeless = sizeless.into_iter().map(sizeless_pick);
    full_hd
        .into_iter()
        .chain(free.chain(sizeless).take(4))
        .collect()
}

/// The quality a video is sold by: 720p and 1080p name the short side.
pub fn short_side(width: Option<f64>, height: Option<f64>) -> Option<f64> {
    match (width, height) {
        (Some(width), Some(height)) => Some(width.min(height)),
        _ => height,
    }
}

/// No shell, a clean env (`PATH` and `HOME=/tmp`) and the URL after `--`.
fn spawn(program: &str, args: &[&str], url: &Url) -> Result<Child, AppError> {
    let mut command = Command::new(program);
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
            tracing::error!(%error, program, "yt-dlp did not start");
            AppError::ExtractFailed
        })
}

/// Keeps the first `STDERR_CAP` bytes and drains the rest: a full pipe would block the child.
async fn read_capped(mut stderr: ChildStderr) -> io::Result<Vec<u8>> {
    let mut kept = Vec::new();
    (&mut stderr)
        .take(STDERR_CAP)
        .read_to_end(&mut kept)
        .await?;
    tokio::io::copy(&mut stderr, &mut tokio::io::sink()).await?;
    Ok(kept)
}

async fn read_json(stdout: ChildStdout) -> io::Result<Vec<u8>> {
    let mut json = Vec::new();
    stdout.take(STDOUT_CAP + 1).read_to_end(&mut json).await?;
    if json.len() as u64 > STDOUT_CAP {
        return Err(io::Error::other("stdout passed 2 MiB"));
    }
    Ok(json)
}

/// stderr can carry the URL and the post's text: it never leaves `debug`.
fn log_stderr(message: &str, platform: &str, url: &Url, stderr: &[u8]) {
    let text = String::from_utf8_lossy(stderr);
    let first_lines = text
        .lines()
        .take(STDERR_LINES)
        .collect::<Vec<_>>()
        .join("\n");
    tracing::debug!(platform, host = url.host_str(), stderr = %first_lines, "{message}");
}

fn probe_failure(stderr: &[u8]) -> AppError {
    let lowercase = String::from_utf8_lossy(stderr).to_lowercase();
    if NOT_FOUND_HINTS.iter().any(|hint| lowercase.contains(hint)) {
        AppError::NotFound
    } else {
        AppError::ExtractFailed
    }
}

async fn run_probe(mut child: Child) -> Result<(ExitStatus, Vec<u8>, Vec<u8>), AppError> {
    let (Some(stdout), Some(stderr)) = (child.stdout.take(), child.stderr.take()) else {
        return Err(AppError::ExtractFailed);
    };
    let run = async {
        let (json, stderr) = tokio::try_join!(read_json(stdout), read_capped(stderr))?;
        Ok::<_, io::Error>((child.wait().await?, json, stderr))
    };
    match tokio::time::timeout(TIMEOUT, run).await {
        Ok(Ok(output)) => Ok(output),
        Ok(Err(error)) => {
            tracing::warn!(%error, "yt-dlp probe output unreadable");
            Err(AppError::ExtractFailed)
        }
        Err(_) => {
            tracing::warn!("yt-dlp probe timed out");
            Err(AppError::ExtractFailed)
        }
    }
}

/// `yt-dlp -J`. The API picks from `formats[]` itself: `-f b*` (anything with video or audio)
/// only keeps the default selector from failing the probe.
pub async fn probe(program: &str, url: &Url, platform: &str) -> Result<Probe, AppError> {
    let child = spawn(program, &["-J", "--flat-playlist", "-f", "b*"], url)?;
    let (status, json, stderr) = run_probe(child).await?;
    if !status.success() {
        log_stderr("yt-dlp probe stderr", platform, url, &stderr);
        let error = probe_failure(&stderr);
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
pub fn stream(
    program: &str,
    url: &Url,
    platform: &str,
    format_id: &str,
) -> Result<Child, AppError> {
    let mut child = spawn(
        program,
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

#[cfg(test)]
mod tests {
    use super::*;

    /// `formats[]` of `yt-dlp -J` on 2026-10-30: tiktok.com/@scout2015/video/6718335390845095173,
    /// x.com/SpaceX/status/1732824684683784516 (`hls-*` and `http-*`) and
    /// facebook.com/reel/1195289147628387 (progressive `hd`/`sd` with no size, DASH vp9 without
    /// audio and an m4a track). `probe-dash.json` keeps only Facebook's DASH rows.
    fn fixture(json: &str) -> Vec<Format> {
        serde_json::from_str::<Probe>(json).unwrap().formats
    }

    fn picks(formats: &[Format]) -> Vec<(u32, String, Tier, Option<u64>)> {
        pick_formats(formats)
            .into_iter()
            .map(|pick| (pick.height, pick.format_id, pick.tier, pick.filesize_bytes))
            .collect()
    }

    const TIKTOK: &str = include_str!("../../tests/fixtures/probe-tiktok.json");
    const X: &str = include_str!("../../tests/fixtures/probe-x.json");
    const FACEBOOK: &str = include_str!("../../tests/fixtures/probe-facebook.json");
    const DASH: &str = include_str!("../../tests/fixtures/probe-dash.json");

    #[test]
    fn tiktok_keeps_one_format_per_short_side_and_prefers_h264_then_tbr() {
        assert_eq!(
            picks(&fixture(TIKTOK)),
            [
                (
                    720,
                    "bytevc1_720p_1504834-0".into(),
                    Tier::Free,
                    Some(2004627)
                ),
                (576, "h264_540p_2240963-0".into(), Tier::Free, Some(2953029)),
            ]
        );
    }

    #[test]
    fn x_takes_null_acodec_as_progressive_and_sells_1080_as_full_hd() {
        assert_eq!(
            picks(&fixture(X)),
            [
                (1080, "http-10368".into(), Tier::FullHd, Some(148161312)),
                (720, "http-2176".into(), Tier::Free, Some(31095584)),
                (360, "http-832".into(), Tier::Free, Some(11889488)),
                (270, "http-256".into(), Tier::Free, Some(3658304)),
            ]
        );
    }

    #[test]
    fn facebook_offers_its_sizeless_hd_and_sd_as_free() {
        let picked: Vec<(String, String, Tier, bool)> = pick_formats(&fixture(FACEBOOK))
            .into_iter()
            .map(|pick| (pick.quality, pick.format_id, pick.tier, pick.h264))
            .collect();
        assert_eq!(
            picked,
            [
                ("HD".to_owned(), "hd".to_owned(), Tier::Free, true),
                ("SD".to_owned(), "sd".to_owned(), Tier::Free, true),
            ]
        );
    }

    #[test]
    fn dash_only_video_offers_nothing() {
        assert_eq!(picks(&fixture(DASH)), []);
    }
}
