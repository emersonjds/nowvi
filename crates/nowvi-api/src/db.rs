use std::time::Duration;

use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;

pub async fn connect(database_url: &str) -> Result<PgPool, sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(5))
        .connect(database_url)
        .await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(pool)
}

/// An empty `quality` comes from a token signed before NOWVI-22, which was always 720p.
pub async fn record_download(pool: PgPool, platform: String, quality: String) {
    let quality = if quality.is_empty() {
        "720p".into()
    } else {
        quality
    };
    let inserted = sqlx::query("INSERT INTO downloads (platform, quality) VALUES ($1, $2)")
        .bind(&platform)
        .bind(&quality)
        .execute(&pool)
        .await;
    if let Err(error) = inserted {
        tracing::error!(%error, platform, "recording the download failed");
    }
}
