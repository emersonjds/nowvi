# Build context: the repo root (docker build -f crates/nowvi-api/Dockerfile .).
FROM rust:1.97-slim-bookworm@sha256:2775a09d208ff0d7c1f50490c45b62db929e87ba1dcbc3f2132ac71a704bcdd3 AS build
WORKDIR /src
COPY crates/nowvi-api ./
RUN cargo build --release --locked

# The standalone yt-dlp bundles its own Python; ffmpeg comes back with NOWVI-13.
FROM debian:bookworm-slim@sha256:99c0b25c46d0214d5a2091092e7908907dcaecd6a962cde0ac700acee222b6f3 AS ytdlp
ARG YTDLP_VERSION=2026.10.26
ARG TARGETARCH
WORKDIR /ytdlp
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && case "$TARGETARCH" in arm64) asset=yt-dlp_linux_aarch64 ;; *) asset=yt-dlp_linux ;; esac \
    && base="https://github.com/yt-dlp/yt-dlp/releases/download/$YTDLP_VERSION" \
    && curl -fsSLO "$base/$asset" -fsSLO "$base/SHA2-256SUMS" \
    && grep " $asset\$" SHA2-256SUMS | sha256sum -c - \
    && install -m 755 "$asset" /usr/local/bin/yt-dlp

FROM debian:bookworm-slim@sha256:99c0b25c46d0214d5a2091092e7908907dcaecd6a962cde0ac700acee222b6f3
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*
COPY --from=ytdlp /usr/local/bin/yt-dlp /usr/local/bin/yt-dlp
RUN useradd --create-home --uid 10001 nowvi
COPY --from=build /src/target/release/nowvi-api /usr/local/bin/nowvi-api
USER nowvi
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/usr/local/bin/nowvi-api"]
