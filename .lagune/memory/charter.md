# Nowvi Security Charter

## Principles

### I. Secrets live only in the environment, never in code or the web bundle

Never commit a secret, and never put one in a `NEXT_PUBLIC_*` variable or anything else that ships to the browser. Always read secrets (`DOWNLOAD_TOKEN_SECRET`, `DATABASE_URL`, the payment gateway key) from the server environment at runtime, and keep `.env` files out of git and out of every container build context.

- Why: anything in the bundle or in git history is public forever; a leaked signing key lets anyone mint download tokens, and a leaked gateway key moves money.

### II. The server only fetches from the allowlisted video hosts

Always validate a submitted link before any fetch: `https` only, no userinfo, no port, and a host that ends in one of the allowlisted networks (`instagram.com`, `tiktok.com`, `x.com`, `twitter.com`, `facebook.com`, `fb.watch`). Always restrict yt-dlp to the extractors of those networks, and MUST re-check the page yt-dlp resolved (`webpage_url`) against the same allowlist before using the result. Never add a generic or redirect-following extractor.

- Why: the API runs inside Railway's private network, next to Postgres; a server that opens any URL a visitor sends can be turned against internal services or cloud metadata (SSRF).

### III. Subprocesses run without a shell and with a fixed command line

Always start yt-dlp directly, never through a shell, with a fixed argument list, the URL after `--`, a cleared environment (only `PATH` and `HOME=/tmp`), and `--ignore-config --no-plugin-dirs --no-cache-dir`. The yt-dlp binary MUST be a pinned version verified by its published checksum.

- Why: a link that reaches a shell or becomes a flag is remote command execution on the server, and an unverified binary is someone else's code running with the API's access.

### IV. Every expensive job has a ceiling that no single client can hold

Always bound each yt-dlp job and each download stream: a per-client rate limit on `/api/*`, at most 2 jobs per client, a global job semaphore, a time limit that fires even when the client stops reading, a stall timeout, and output size caps. The request body MUST stay capped at 4 KB.

- Why: each job is a process plus paid egress; without hard ceilings a handful of clients can exhaust the job slots for everyone or run up the Railway bill.

### V. Paid quality and the ad wait are enforced by the server

Always issue a download only through a server-signed HMAC token, compared in constant time, that binds the URL, the format and the `nbf`/`exp` window. Never issue a free token for a format at or above 1080p, and never trust the client for price, format or tier.

- Why: if the browser or an unsized format decides what is free, Full HD and the ad wait are given away, which is the whole revenue model.

### VI. Errors leave as fixed codes, never as server text

Always answer an API error as `{"error": "<code>"}` from the closed list in the spec, and answer a failed browser navigation (`/api/download`) with a `303` to the web origin carrying only that code. The web MUST map each code to a fixed sentence and never render a response body, yt-dlp output or an exception message.

- Why: echoing server or extractor text leaks internals and lets attacker-controlled content (a post title, an error string) reach the page.

### VII. Personal data stays out of logs, and ads wait for consent (LGPD)

Never log a visitor's IP address, the submitted link or yt-dlp's stderr above `debug`. Always keep stored metrics aggregate (network and quality only). Never load an ad or any third-party tracker before the visitor accepts, and always let the visitor withdraw that consent as easily as they gave it. The privacy text MUST describe what the site actually processes.

- Why: logs and ad scripts are where personal data leaks without anyone noticing, and LGPD requires consent that is informed, specific and revocable.

### VIII. Browsers get a restrictive policy on every response

Always serve the web with a restrictive Content Security Policy (no `unsafe-eval`, `object-src 'none'`, `frame-ancestors 'none'`, connections only to the API), `nosniff`, a strict referrer policy, HSTS, and third-party ad code only inside a sandboxed iframe without `allow-same-origin`. The API MUST send `nosniff` and `no-store` on responses that carry tokens. CORS MUST list explicit origins, never `*`.

- Why: these headers are the second wall behind output encoding; without them one injected script or one framing trick reads tokens or turns the page against its visitors.

### IX. What ships is pinned, minimal and audited

Always build images from pinned bases, run containers as a non-root user, keep build tools and CLIs out of runtime dependencies, and audit npm and Cargo dependencies before a release. Deploy configuration (healthchecks, restart policy) MUST be the one actually applied by Railway, not only a file in the repo.

- Why: an unpinned base or an unused CLI in production is attack surface nobody reviews, and a config file the platform ignores gives false confidence.

## Baseline discipline

Lagune holds this charter, every principle, every time. A principle is not suspended because a control looks small, familiar, or unlikely to be hit. This is not a judgement call.

### Only the controls the project needs

Lagune recommends and applies only the controls this project's context calls for. A control the project does not need is never added for completeness, and a generic checklist is not thoroughness. Every later phase acts on what the system actually does, never on what it might hypothetically do.

- Why: effort spent on risks the project does not have buries the risks it does have. Fewer, right-sized controls are easier to apply, prove, and keep true than a checklist no one finishes.

### Prefer the simplest vetted control

When a control is needed, reach for the safest option already proven, in order: a control this project already has, then a platform or framework built-in, then a well-maintained vetted library, and only then custom code. Never hand-roll a security primitive (cryptography, escaping, authentication, sessions) that a vetted standard already provides. A new dependency is new attack surface, justified and not assumed. Code, an endpoint, or a feature the project does not use is attack surface too, so removing it is itself a control.

- Why: hand-rolled security is where subtle, unaudited bugs live, and a second control duplicating an existing one is the one that gets forgotten and drifts. Boring, standard controls are easier to audit and harder to get wrong, and less surface is less to defend.

### When a control seems skippable

A control is held even when a reason to skip it feels reasonable:

- "Too small to need a control": small gaps are where breaches start.
- "Already handled elsewhere": assumed coverage is exactly how gaps hide.
- "Unlikely to be hit": attackers target the path no one is watching.
- "It works, ship it": working and safe are different claims, and the charter requires both.

## Governance

This charter derives from the v0 spec (`docs/specs/2026-10-29-nowvi-v0-design.md`, sections "Contrato da API" and "Proteções"), the formats card (`docs/specs/cards/NOWVI-22-formats.md`) and the project rules in `.claude/CLAUDE.md`. It overrides ad hoc decisions on cards. Any card that touches security, the API contract, money or more than ~200 lines is reviewed against it by the `qa` agent before merge into `developer`. A change to a principle goes through its own card, updates the spec when the contract moves, and bumps the version: MAJOR for removing or redefining a principle, MINOR for adding or widening one, PATCH for wording.

Version: 1.0.0 | Ratified: 2026-10-30
