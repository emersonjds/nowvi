use url::Url;

use crate::error::AppError;

/// Host suffix and the `platform` it answers with.
const HOSTS: [(&str, &str); 6] = [
    ("instagram.com", "instagram"),
    ("tiktok.com", "tiktok"),
    ("x.com", "x"),
    ("twitter.com", "x"),
    ("facebook.com", "facebook"),
    ("fb.watch", "facebook"),
];

/// The https URL, normalized, and its platform. `www.instagram.com` passes;
/// `instagram.com.evil.com` and `notinstagram.com` do not.
pub fn check(raw: &str) -> Result<(Url, &'static str), AppError> {
    let url = Url::parse(raw.trim()).map_err(|_| AppError::InvalidUrl)?;
    // `Url` drops a default `:443`: `port()` only sees one that would reach another service.
    if url.scheme() != "https"
        || !url.username().is_empty()
        || url.password().is_some()
        || url.port().is_some()
    {
        return Err(AppError::InvalidUrl);
    }
    let Some(url::Host::Domain(host)) = url.host() else {
        return Err(AppError::UnsupportedPlatform);
    };
    let platform = HOSTS
        .iter()
        .find(|(suffix, _)| {
            host == *suffix
                || host
                    .strip_suffix(suffix)
                    .is_some_and(|subdomain| subdomain.ends_with('.'))
        })
        .map(|(_, platform)| *platform)
        .ok_or(AppError::UnsupportedPlatform)?;
    Ok((url, platform))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_the_six_hosts_and_their_subdomains() {
        let accepted = [
            ("https://instagram.com/reel/1", "instagram"),
            ("https://www.instagram.com/reel/1", "instagram"),
            ("https://www.tiktok.com/@nowvi/video/1", "tiktok"),
            ("https://vm.tiktok.com/ZM1/", "tiktok"),
            ("https://x.com/nowvi/status/1", "x"),
            ("https://mobile.twitter.com/nowvi/status/1", "x"),
            ("https://www.facebook.com/reel/1", "facebook"),
            ("https://fb.watch/abc/", "facebook"),
            ("  https://x.com/nowvi/status/1  ", "x"),
            ("https://x.com:443/nowvi/status/1", "x"),
        ];
        for (raw_url, expected_platform) in accepted {
            let (_, platform) =
                check(raw_url).unwrap_or_else(|error| panic!("{raw_url}: {error:?}"));
            assert_eq!(platform, expected_platform, "{raw_url}");
        }
    }

    #[test]
    fn refuses_a_url_that_is_not_plain_https() {
        let refused = [
            "http://x.com/nowvi/status/1",
            "ftp://x.com/video.mp4",
            "https://user@x.com/nowvi/status/1",
            "https://user:secret@x.com/nowvi/status/1",
            "https://x.com:8443/nowvi/status/1",
            "x.com/nowvi/status/1",
            "",
        ];
        for raw_url in refused {
            assert_eq!(check(raw_url), Err(AppError::InvalidUrl), "{raw_url}");
        }
    }

    #[test]
    fn refuses_a_host_outside_the_list() {
        let refused = [
            "https://instagram.com.evil.com/reel/1",
            "https://notinstagram.com/reel/1",
            "https://evilx.com/nowvi/status/1",
            "https://youtube.com/watch?v=1",
            "https://192.0.2.1/video",
            "https://[2001:db8::1]/video",
        ];
        for raw_url in refused {
            assert_eq!(
                check(raw_url),
                Err(AppError::UnsupportedPlatform),
                "{raw_url}"
            );
        }
    }
}
