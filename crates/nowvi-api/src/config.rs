use std::time::Duration;

use axum::http::HeaderValue;

/// The env of the spec's "Env" table, read once at boot.
pub struct Config {
    pub port: u16,
    pub database_url: String,
    pub token_secret: Vec<u8>,
    pub web_origins: Vec<HeaderValue>,
    pub ad_wait_seconds: u64,
    pub max_concurrent_jobs: usize,
    pub ytdlp_bin: String,
    /// The spec's stream limits, fixed outside tests: 30 s without a chunk moving, 10 min in all.
    pub stream_idle_timeout: Duration,
    pub stream_deadline: Duration,
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        let var = |name: &str| std::env::var(name).ok().filter(|value| !value.is_empty());
        let database_url = var("DATABASE_URL").ok_or("DATABASE_URL is required")?;
        let token_secret = var("DOWNLOAD_TOKEN_SECRET")
            .ok_or("DOWNLOAD_TOKEN_SECRET is required")?
            .into_bytes();
        if token_secret.len() < 32 {
            return Err("DOWNLOAD_TOKEN_SECRET must have at least 32 bytes".into());
        }
        let web_origins: Vec<_> = var("WEB_ORIGIN")
            .unwrap_or_else(|| "http://localhost:3000".into())
            .split(',')
            .map(str::trim)
            .filter(|origin| !origin.is_empty())
            .map(|origin| match origin {
                "*" => Err("WEB_ORIGIN must list origins, not *".to_string()),
                _ => HeaderValue::from_str(origin)
                    .map_err(|_| format!("WEB_ORIGIN has an invalid origin: {origin}")),
            })
            .collect::<Result<_, _>>()?;
        if web_origins.is_empty() {
            return Err("WEB_ORIGIN must list at least one origin".into());
        }
        let max_concurrent_jobs = number(var("MAX_CONCURRENT_JOBS"), "MAX_CONCURRENT_JOBS", 6)?;
        if !(1..=1024).contains(&max_concurrent_jobs) {
            return Err("MAX_CONCURRENT_JOBS must be between 1 and 1024".into());
        }
        Ok(Config {
            port: number(var("PORT"), "PORT", 8080)?,
            database_url,
            token_secret,
            web_origins,
            ad_wait_seconds: number(var("AD_WAIT_SECONDS"), "AD_WAIT_SECONDS", 30)?,
            max_concurrent_jobs,
            ytdlp_bin: var("YTDLP_BIN").unwrap_or_else(|| "yt-dlp".into()),
            stream_idle_timeout: Duration::from_secs(30),
            stream_deadline: Duration::from_secs(10 * 60),
        })
    }
}

fn number<T: std::str::FromStr>(
    value: Option<String>,
    name: &str,
    default: T,
) -> Result<T, String> {
    match value {
        None => Ok(default),
        Some(value) => value
            .trim()
            .parse()
            .map_err(|_| format!("{name}={value:?} is not a valid number")),
    }
}
