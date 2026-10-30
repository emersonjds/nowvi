use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;

use crate::error::AppError;

/// A token stays valid this long after `nbf`.
pub const LIFETIME_SECONDS: u64 = 15 * 60;

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct Claims {
    pub u: String,
    pub p: String,
    pub f: String,
    pub e: String,
    /// `"<height>p"`; tokens signed before NOWVI-22 lack it.
    #[serde(default)]
    pub q: String,
    pub nbf: u64,
    pub exp: u64,
}

fn mac(secret: &[u8]) -> Hmac<Sha256> {
    Hmac::<Sha256>::new_from_slice(secret).expect("HMAC takes a key of any size")
}

/// `base64url(json).base64url(hmac_sha256(secret, json))`.
pub fn sign(secret: &[u8], claims: &Claims) -> String {
    let json = serde_json::to_vec(claims).expect("claims always serialize");
    let mut mac = mac(secret);
    mac.update(&json);
    format!(
        "{}.{}",
        URL_SAFE_NO_PAD.encode(&json),
        URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes())
    )
}

pub fn verify(secret: &[u8], token: &str, now: u64) -> Result<Claims, AppError> {
    let (json, signature) = token.split_once('.').ok_or(AppError::InvalidToken)?;
    let json = URL_SAFE_NO_PAD
        .decode(json)
        .map_err(|_| AppError::InvalidToken)?;
    let signature = URL_SAFE_NO_PAD
        .decode(signature)
        .map_err(|_| AppError::InvalidToken)?;
    let mut mac = mac(secret);
    mac.update(&json);
    mac.verify_slice(&signature)
        .map_err(|_| AppError::InvalidToken)?;
    let claims: Claims = serde_json::from_slice(&json).map_err(|_| AppError::InvalidToken)?;
    if now < claims.nbf {
        return Err(AppError::TooEarly);
    }
    if now >= claims.exp {
        return Err(AppError::Expired);
    }
    Ok(claims)
}

pub fn now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |elapsed| elapsed.as_secs())
}

#[cfg(test)]
mod tests {
    use super::*;

    const SECRET: [u8; 32] = [7; 32];

    fn claims(nbf: u64, exp: u64) -> Claims {
        Claims {
            u: "https://x.com/nowvi/status/1".into(),
            p: "x".into(),
            f: "http-2176".into(),
            e: "mp4".into(),
            q: "720p".into(),
            nbf,
            exp,
        }
    }

    /// Signs any bytes the way `sign` signs the claims' JSON.
    fn sign_json(json: &[u8]) -> String {
        let mut mac = mac(&SECRET);
        mac.update(json);
        format!(
            "{}.{}",
            URL_SAFE_NO_PAD.encode(json),
            URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes())
        )
    }

    #[test]
    fn a_signed_token_verifies_back_to_its_claims_between_nbf_and_exp() {
        let download_token = sign(&SECRET, &claims(100, 200));
        assert_eq!(verify(&SECRET, &download_token, 100), Ok(claims(100, 200)));
        assert_eq!(verify(&SECRET, &download_token, 199), Ok(claims(100, 200)));
    }

    #[test]
    fn a_token_is_too_early_before_nbf_and_expired_from_exp_on() {
        let download_token = sign(&SECRET, &claims(100, 200));
        assert_eq!(
            verify(&SECRET, &download_token, 99),
            Err(AppError::TooEarly)
        );
        assert_eq!(
            verify(&SECRET, &download_token, 200),
            Err(AppError::Expired)
        );
    }

    #[test]
    fn a_swapped_payload_or_another_secret_is_an_invalid_token() {
        let download_token = sign(&SECRET, &claims(100, 200));
        let (_, signature) = download_token.split_once('.').expect("two parts");
        let other_payload = URL_SAFE_NO_PAD
            .encode(serde_json::to_vec(&claims(100, 9_999)).expect("claims serialize"));
        let swapped = format!("{other_payload}.{signature}");
        assert_eq!(verify(&SECRET, &swapped, 150), Err(AppError::InvalidToken));
        assert_eq!(
            verify(&[8; 32], &download_token, 150),
            Err(AppError::InvalidToken)
        );
    }

    #[test]
    fn a_malformed_token_is_invalid_without_a_panic() {
        let signed_garbage = sign_json(b"not json");
        for malformed in ["", "no-dot", "!!!.???", "e30.!!!", "e30.", &signed_garbage] {
            assert_eq!(
                verify(&SECRET, malformed, 150),
                Err(AppError::InvalidToken),
                "{malformed}"
            );
        }
    }

    #[test]
    fn claims_signed_before_the_quality_claim_still_verify_with_an_empty_quality() {
        let old_json = br#"{"u":"https://x.com/nowvi/status/1","p":"x","f":"http-2176","e":"mp4","nbf":100,"exp":200}"#;
        let verified =
            verify(&SECRET, &sign_json(old_json), 150).expect("an old token still verifies");
        assert_eq!(verified.q, "");
        assert_eq!(verified.f, "http-2176");
    }
}
