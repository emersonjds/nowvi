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
