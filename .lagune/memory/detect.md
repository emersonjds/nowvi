# Nowvi Detect Map

- **Scope:** full project scan (the `crates/nowvi-api` backend, the `apps/web` front end, both Dockerfiles, the Railway config files and the dependency manifests)
- **Mapped:** 2026-10-30

## Findings

### Download slot held by a client that stops reading

- **What it is:** a download keeps its yt-dlp process, one of the client's two job slots and one of the six global semaphore permits for as long as the response body is alive. The 10-minute total limit and the 30-second stall limit are only checked when the server asks the body for its next chunk, and the server only asks when the client's connection can take more bytes. A client that opens the download and then stops reading (while keeping the connection open) is never asked again, so neither limit fires. The per-client cap of 2 jobs groups IPv6 by /64, and a single cheap IPv6 allocation holds thousands of /64 prefixes.
- **Why it matters:** three clients (or one client with a few IPv6 prefixes) can hold all six job slots indefinitely, and every other visitor gets `busy` on both `/api/info` and `/api/download`. The site stops working for everyone at almost no cost to the attacker.
- **Evidence:** the `download` handler's `stream` function builds the body with `futures_util::stream::unfold` and checks `deadline` and `CHUNK_TIMEOUT` inside that closure; the `Job` struct owns the `Slot` (client guard plus semaphore permit) and the child; `client_ip` masks IPv6 to /64 before `start_job` counts jobs.

### Reusable download token

- **What it is:** a free download token stays valid for 15 minutes after the ad wait and can be used any number of times by anyone who holds it. It travels in the query string of `/api/download`, so it also lands in browser history and in any HTTP access log in front of the API. The single-use nonce was deferred to NOWVI-18 and is still absent.
- **Why it matters:** one person can sit through the ad once and share or script the link for unlimited downloads, skipping the ad wait that pays for the free tier, and each reuse is another stream of paid egress (up to 500 MB, 10 minutes).
- **Evidence:** `token::verify` checks only the signature, `nbf` and `exp`, with no record of use; the `Claims` struct has no nonce; the web builds the link with `downloadUrl(token)` and puts it in the "Baixar agora" and "Baixar de novo" anchors.

### Client IP trusted from forwarding headers

- **What it is:** the rate limiter and the per-client job cap identify a client by the `X-Real-IP` header, then by the last entry of `X-Forwarded-For`, and only then by the socket peer. Both headers are text a caller can send. The code relies on Railway's edge proxy overwriting `X-Real-IP`; nothing in the code checks that the request really came through that proxy.
- **Why it matters:** if the edge passes a client-sent `X-Real-IP` through (or the API is ever reached without the edge), anyone can rotate the header on every request and get a fresh rate-limit bucket and a fresh job count each time, so the per-client limits stop limiting.
- **Evidence:** the `client_ip` function in the rate-limit middleware, used by `limit` for the token bucket and by `start_job` for the 2-job cap.

### Facebook HD format offered as free

- **What it is:** Facebook lists its progressive `hd` and `sd` mp4 files without width or height. The format picker puts every unsized mp4 in the free tier, with the `hd` one first, and signs a free token for it. Facebook's `hd` file is often 1080p.
- **Why it matters:** a 1080p video ships free after the ad, skipping the R$ 2 Full HD price; the paid tier is undercut for every Facebook video whose `hd` file is Full HD.
- **Evidence:** the `pick_formats` function, where the `sizeless` list is mapped to `Tier::Free` with `height: 0` (marked with a `ponytail:` comment); the `info` handler then signs a free token for every `Tier::Free` pick.

### Rate-limited download answers in JSON

- **What it is:** the spec says a download is a browser navigation, so every error must come back as a `303` to `/?erro=<code>`. The rate-limit middleware runs before the download handler and answers `429` with the JSON body `{"error":"rate_limited"}` directly, so a visitor who hits the limit on a download sees a raw JSON page instead of the site's message.
- **Why it matters:** the error contract is broken on that path: the visitor is left on an API page with no guidance, and the web's fixed-message mapping is bypassed.
- **Evidence:** the `limit` middleware returns `error.into_response()` for `RateLimited`, and it wraps the whole `/api` router, including the `download` route whose own errors are redirected.

### API responses without browser security headers

- **What it is:** only the successful download stream sets `nosniff` and `Cache-Control: no-store`. The JSON responses of `/api/info` (which carry the signed download tokens), the error responses, the `303` redirects and `/health` set neither, and no response sets a restrictive `Content-Security-Policy` or `X-Frame-Options`.
- **Why it matters:** a JSON response that carries a token can be stored by a shared cache or the browser cache, and a response without `nosniff` can be sniffed as another content type if it is ever loaded directly.
- **Evidence:** the router built in `main` adds only the body limit, CORS and the rate limiter; `AppError::into_response` and the `info` handler return plain `Json` responses.

### Web CSP allows inline scripts and any https frame

- **What it is:** the web's Content Security Policy keeps `'unsafe-inline'` in `script-src` (for the Next bootstrap scripts and the ad iframe's inline config) and allows `frame-src https:`, any https frame.
- **Why it matters:** with `'unsafe-inline'`, the policy no longer stops an injected inline script, so it adds no protection if an XSS sink ever appears; `frame-src https:` lets any page the site embeds be any https origin.
- **Evidence:** the `contentSecurityPolicy` list in the Next config, applied to every path by `headers()`.

### HSTS missing on web and API

- **What it is:** neither the web's security headers nor the API send `Strict-Transport-Security`.
- **Why it matters:** a visitor who types `nowvi.com.br` or follows an old `http://` link makes one cleartext request first, which a network attacker on the same Wi-Fi can intercept and downgrade before the HTTPS redirect.
- **Evidence:** the `securityHeaders` list in the Next config has CSP, `nosniff`, `Referrer-Policy` and `Permissions-Policy` only; the API router adds no header layer.

### Ad consent cannot be withdrawn

- **What it is:** the cookie banner disappears for good once the visitor chooses, and nothing on the site lets them change their mind later. The privacy text also says cookies "measure traffic" (there is no analytics) and that "the only data processed is the video link", while the API keeps the visitor's IP in memory for rate limiting.
- **Why it matters:** LGPD requires that consent can be withdrawn as easily as it was given and that the privacy notice matches what is processed; a visitor who accepted ads cannot stop the ad network's cookies without clearing browser storage by hand.
- **Evidence:** `CookieBanner` returns nothing once `useConsent` is not `null`; the footer `LINKS` list has no consent entry; the "privacidade" item in the legal sections.

### Vulnerable shadcn CLI in production dependencies

- **What it is:** the `shadcn` CLI sits in `dependencies`, not `devDependencies`. `npm audit --omit=dev` reports 3 low advisories through it (`deepmerge` prototype poisoning, GHSA-gcqx-w48m-w2h4, via `@shadcn/registry`). The app only uses it at build time, for `@import "shadcn/tailwind.css"`. No step in the repo runs `npm audit` or `cargo audit` (there is no CI, and `cargo-audit` is not installed).
- **Why it matters:** a CLI in the runtime dependency set is surface nobody reviews, and without an automated audit a new advisory in the Rust or npm tree goes unnoticed until someone looks by hand.
- **Evidence:** `shadcn` under `dependencies` in the web manifest; the npm audit result above; no workflow directory in the repo.

### Container base images on mutable tags

- **What it is:** both Dockerfiles pull their base images by tag (`rust:1.97-slim-bookworm`, `debian:bookworm-slim`, `node:24-bookworm-slim`), never by `@sha256` digest. The yt-dlp binary itself is pinned and checksum-verified.
- **Why it matters:** each rebuild silently takes whatever image the tag points to that day, so a compromised or broken upstream tag reaches production without any change in the repo.
- **Evidence:** the `FROM` lines of the API's build, yt-dlp and runtime stages and of the web's build and runtime stages (Lagune infra hook: "final FROM uses a mutable tag").

### Railway config files not applied

- **What it is:** each app has a `railway.toml` with the Dockerfile path, watch patterns, the healthcheck (`/health`, `/`) and the restart policy, but Railway only reads a config file at the repo root or at a path set in the service settings, so these files are ignored and the services run on whatever the dashboard says.
- **Why it matters:** the healthcheck and restart policy the repo documents may not be enforced, so a broken deploy can go live and stay down, and nobody reading the repo can tell what is really configured.
- **Evidence:** the `[deploy]` sections of the two `railway.toml` files, which sit under `apps/web` and `crates/nowvi-api` rather than at the root.

### Docker build context lets local env files in

- **What it is:** the root `.dockerignore` excludes `**/.env` but not `.env.local`, `.env.production` or other `.env.*` files, and the web Dockerfile copies the whole `apps/web/` folder before `npm run build`, which loads those files.
- **Why it matters:** an image built on a developer's machine can bake local values into the build or the image layers; a secret there ends up in the image history.
- **Evidence:** the fifth line of the root `.dockerignore` and the `COPY apps/web/ ./` step of the web build stage.

## Applied sub-skills

- .lagune/skills/regex.md: required checker ran across the whole project and found no unsafe pattern (the backend has no regex; the web's scheme check in `withScheme` is linear).
- .lagune/skills/network.md: confirmed the SSRF containment (host allowlist, `--use-extractors` with no redirect extractor, `webpage_url` re-check); no new finding, residual items under Not determined.
- .lagune/skills/interpreter.md: the checker flagged the yt-dlp `Command::new`; read statically, no shell, URL after `--`, cleared env, the signed `format_id` as the `-f` value and the `Content-Disposition` filename built only from signed, filtered claims; no finding.
- .lagune/skills/http-request.md: "Client IP trusted from forwarding headers", "Rate-limited download answers in JSON"; the CORS checker found no bypassable allowlist (explicit origins, `*` rejected at boot, no credentials).
- .lagune/skills/credential-endpoint.md: "Download slot held by a client that stops reading" (per-client limit keyed on an IPv6 /64 the attacker rotates cheaply).
- .lagune/skills/access-control.md: "Reusable download token", "Facebook HD format offered as free".
- .lagune/skills/payment.md: "Facebook HD format offered as free"; `/api/orders` is a stub that always answers `503 payments_disabled` and sits under the rate limiter, so nothing trusts a client amount yet.
- .lagune/skills/federation.md: the JWT checker found no unpinned verification; the custom HMAC token uses `verify_slice` (constant time) and a 32-byte minimum secret.
- .lagune/skills/crypto.md: the checker found no weak cryptography (HMAC-SHA256 from the `hmac`/`sha2` crates).
- .lagune/skills/secrets.md: the checker flagged a literal in the web API client; it is the `invalid_token` error sentence, not a credential. No secret in code; `.env` is git-ignored and only `NEXT_PUBLIC_*` reaches the bundle. Surfaced "Docker build context lets local env files in".
- .lagune/skills/browser.md: "Web CSP allows inline scripts and any https frame", "Ad consent cannot be withdrawn"; the JSON-LD `dangerouslySetInnerHTML` serializes static copy with `<` escaped, the `?erro=` code is parsed by a closed zod enum, the thumbnail is https-only with `no-referrer`, and the ad runs in a srcdoc iframe sandboxed without `allow-same-origin`.
- .lagune/skills/transport.md: "HSTS missing on web and API"; sqlx connects with rustls.
- .lagune/skills/javascript.md: no `eval`, `child_process` or prototype-merge on untrusted input in the web; surfaced "Vulnerable shadcn CLI in production dependencies".
- .lagune/skills/container.md: both images run as non-root (`nowvi` uid 10001, `node`), multi-stage, `tini` as PID 1; surfaced "Container base images on mutable tags".
- .lagune/skills/infra.md: the checker flagged the mutable `FROM` tags; surfaced "Railway config files not applied".
- .lagune/skills/sql.md: every query is a static sqlx statement with bound parameters; the pool is capped at 5 connections; no finding.
- .lagune/skills/rust.md: `unsafe_code = "forbid"`, no `transmute`, `Send`/`Sync` impls or FFI; the `f64 as u64` casts saturate and the token times are far from overflow; no finding.

## Not determined

- Whether Railway's edge overwrites a client-sent `X-Real-IP` (and whether the API can be reached without the edge). The rating of "Client IP trusted from forwarding headers" depends on it; confirm with a request carrying a forged `X-Real-IP` against the deployed API.
- Whether Railway's edge propagates backpressure from a client that stops reading, or buffers the whole stream itself, and whether it enforces a maximum request duration. This decides how long "Download slot held by a client that stops reading" can hold a slot in production.
- yt-dlp follows the media URLs and HTTP redirects the platform's own API returns; the allowlist checks the submitted link and `webpage_url`, not every media host. Reaching an internal address would need a platform API to return one, so it is contained by `--use-extractors`, but it was not proven from the code alone.
- Whether `RUST_LOG` is set to `debug` anywhere in Railway; at `debug`, yt-dlp's stderr (the video link and post text) reaches the logs.
- `cargo audit` was not run: `cargo-audit` is not installed on this machine.
