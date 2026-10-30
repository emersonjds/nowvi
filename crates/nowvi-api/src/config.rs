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
        Self::from_vars(|name| std::env::var(name).ok())
    }

    fn from_vars(read: impl Fn(&str) -> Option<String>) -> Result<Self, String> {
        let var = |name: &str| read(name).filter(|value| !value.is_empty());
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

#[cfg(test)]
mod tests {
    use super::*;

    const SECRET: &str = "0123456789abcdef0123456789abcdef";

    fn boot(vars: &[(&str, &str)]) -> Result<Config, String> {
        let required = [
            ("DATABASE_URL", "postgres://db"),
            ("DOWNLOAD_TOKEN_SECRET", SECRET),
        ];
        Config::from_vars(|name| {
            vars.iter()
                .chain(&required)
                .find(|(key, _)| *key == name)
                .map(|(_, value)| value.to_string())
        })
    }

    fn boot_error(vars: &[(&str, &str)]) -> String {
        boot(vars).err().expect("the boot fails")
    }

    #[test]
    fn the_required_vars_alone_boot_with_the_spec_defaults() {
        let config = boot(&[]).expect("the defaults boot");
        assert_eq!(config.port, 8080);
        assert_eq!(config.database_url, "postgres://db");
        assert_eq!(config.token_secret, SECRET.as_bytes());
        assert_eq!(config.web_origins, ["http://localhost:3000"]);
        assert_eq!(config.ad_wait_seconds, 30);
        assert_eq!(config.max_concurrent_jobs, 6);
        assert_eq!(config.ytdlp_bin, "yt-dlp");
    }

    #[test]
    fn every_var_overrides_its_default() {
        let config = boot(&[
            ("PORT", "9000"),
            (
                "WEB_ORIGIN",
                "https://nowvi.com.br, https://www.nowvi.com.br",
            ),
            ("AD_WAIT_SECONDS", " 5 "),
            ("MAX_CONCURRENT_JOBS", "1024"),
            ("YTDLP_BIN", "/usr/local/bin/yt-dlp"),
        ])
        .expect("valid vars boot");
        assert_eq!(config.port, 9000);
        assert_eq!(
            config.web_origins,
            ["https://nowvi.com.br", "https://www.nowvi.com.br"]
        );
        assert_eq!(config.ad_wait_seconds, 5);
        assert_eq!(config.max_concurrent_jobs, 1024);
        assert_eq!(config.ytdlp_bin, "/usr/local/bin/yt-dlp");
    }

    #[test]
    fn a_missing_database_url_or_secret_stops_the_boot() {
        let no_database =
            Config::from_vars(|name| (name == "DOWNLOAD_TOKEN_SECRET").then(|| SECRET.to_string()));
        assert_eq!(
            no_database.err().as_deref(),
            Some("DATABASE_URL is required")
        );
        let empty_secret = boot_error(&[("DOWNLOAD_TOKEN_SECRET", "")]);
        assert_eq!(empty_secret, "DOWNLOAD_TOKEN_SECRET is required");
    }

    #[test]
    fn a_secret_under_32_bytes_stops_the_boot() {
        assert_eq!(
            boot_error(&[("DOWNLOAD_TOKEN_SECRET", "0123456789abcdef0123456789abcde")]),
            "DOWNLOAD_TOKEN_SECRET must have at least 32 bytes"
        );
    }

    #[test]
    fn a_wildcard_empty_or_invalid_web_origin_stops_the_boot() {
        assert_eq!(
            boot_error(&[("WEB_ORIGIN", "https://nowvi.com.br,*")]),
            "WEB_ORIGIN must list origins, not *"
        );
        assert_eq!(
            boot_error(&[("WEB_ORIGIN", " , ")]),
            "WEB_ORIGIN must list at least one origin"
        );
        assert_eq!(
            boot_error(&[("WEB_ORIGIN", "https://nowvi.com.br\u{7f}")]),
            "WEB_ORIGIN has an invalid origin: https://nowvi.com.br\u{7f}"
        );
    }

    #[test]
    fn max_concurrent_jobs_outside_1_to_1024_stops_the_boot() {
        for out_of_range in ["0", "1025"] {
            assert_eq!(
                boot_error(&[("MAX_CONCURRENT_JOBS", out_of_range)]),
                "MAX_CONCURRENT_JOBS must be between 1 and 1024"
            );
        }
    }

    #[test]
    fn a_var_that_is_not_a_number_stops_the_boot() {
        assert_eq!(
            boot_error(&[("PORT", "eighty")]),
            r#"PORT="eighty" is not a valid number"#
        );
    }
}
