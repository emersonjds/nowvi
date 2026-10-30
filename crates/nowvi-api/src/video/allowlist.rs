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
    // `Url` drops a default `:443`, so only a port that would reach the host is seen here.
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
                    .is_some_and(|rest| rest.ends_with('.'))
        })
        .map(|(_, platform)| *platform)
        .ok_or(AppError::UnsupportedPlatform)?;
    Ok((url, platform))
}
