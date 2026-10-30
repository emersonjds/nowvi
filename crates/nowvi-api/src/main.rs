mod config;
mod db;
mod error;
mod orders;
mod rate_limit;
mod token;
mod video;

use std::sync::Arc;
use std::time::Duration;

use axum::Router;
use axum::extract::DefaultBodyLimit;
use axum::http::Method;
use axum::http::header::CONTENT_TYPE;
use axum::routing::{get, post};
use sqlx::PgPool;
use tokio::sync::Semaphore;
use tower_http::cors::{AllowOrigin, CorsLayer};

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub config: Arc<config::Config>,
    pub jobs: Arc<Semaphore>,
    pub limits: Arc<rate_limit::RateLimits>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();
    let config = match config::Config::from_env() {
        Ok(config) => config,
        Err(message) => {
            tracing::error!("invalid config: {message}");
            std::process::exit(1);
        }
    };
    let pool = db::connect(&config.database_url).await?;
    let limits = Arc::new(rate_limit::RateLimits::default());
    let prune_limits = limits.clone();
    tokio::spawn(async move {
        let mut every_minute = tokio::time::interval(Duration::from_secs(60));
        loop {
            every_minute.tick().await;
            prune_limits.prune();
        }
    });
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(config.web_origins.clone()))
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([CONTENT_TYPE]);
    let address = std::net::SocketAddr::from((std::net::Ipv6Addr::UNSPECIFIED, config.port));
    let state = AppState {
        pool,
        jobs: Arc::new(Semaphore::new(config.max_concurrent_jobs)),
        config: Arc::new(config),
        limits,
    };
    let api = Router::new()
        .route("/api/info", post(video::info))
        .route("/api/download", get(video::download))
        .route("/api/orders", post(orders::create))
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            rate_limit::limit,
        ));
    let app = api
        .route("/health", get(|| async { "ok" }))
        .layer(DefaultBodyLimit::max(4 * 1024))
        .layer(cors)
        .with_state(state);
    let listener = tokio::net::TcpListener::bind(address).await?;
    tracing::info!(%address, "nowvi-api listening");
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown())
    .await?;
    Ok(())
}

/// SIGTERM (Railway, tini) or ctrl-c: stop accepting and let open streams finish.
async fn shutdown() {
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
            }
            Err(_) => std::future::pending().await,
        }
    };
    tokio::select! {
        _ = tokio::signal::ctrl_c() => {}
        _ = terminate => {}
    }
    tracing::info!("nowvi-api shutting down");
}
