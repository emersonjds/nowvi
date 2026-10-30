# Build context: the repo root (docker build -f crates/nowvi-api/Dockerfile .).
FROM rust:slim-bookworm AS build
WORKDIR /src
COPY crates/nowvi-api ./
RUN cargo build --release --locked

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates ffmpeg python3 \
    && rm -rf /var/lib/apt/lists/*
ADD --chmod=755 https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp /usr/local/bin/yt-dlp
RUN useradd --create-home --uid 10001 nowvi
COPY --from=build /src/target/release/nowvi-api /usr/local/bin/nowvi-api
USER nowvi
ENV PORT=8080
EXPOSE 8080
CMD ["/usr/local/bin/nowvi-api"]
