# Nowvi Defense Plan

- **Scope:** all detect findings
- **Planned:** 2026-10-30

## Fixes

### Download slot held by a client that stops reading

- **Category:** Uncontrolled resource consumption (CWE-400), allocation of resources without limits (CWE-770)
- **CVSS:** CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:N/VI:N/VA:H/SC:N/SI:N/SA:N (8.2, High)
- **Priority:** High
- **Why this priority:** anyone on the internet reaches it without an account and it takes the whole service down for every visitor; the one condition (Railway's edge passing backpressure through) is assumed present because detect could not rule it out.
- **Upholds:** IV. Every expensive job has a ceiling that no single client can hold
- **Fix:** make the time limit independent of the client reading. Move the yt-dlp `Child` and the job `Slot` out of the response body into a small watchdog task that waits on `sleep_until(deadline)` and on a drop signal from the body; when either fires it kills the child and drops the slot. The body keeps only stdout and the drop signal, so a client that stops reading loses the process and the slot at the deadline at the latest.

  Key the per-client job cap on a wider IPv6 prefix (/48, or /56 at least) than the rate-limit bucket, so one cheap IPv6 allocation does not count as thousands of clients.
- **References:** [CWE-400: Uncontrolled Resource Consumption](https://cwe.mitre.org/data/definitions/400.html), [CWE-770: Allocation of Resources Without Limits or Throttling](https://cwe.mitre.org/data/definitions/770.html)

### Reusable download token

- **Category:** Authentication bypass by capture-replay (CWE-294)
- **CVSS:** CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:L/VA:L/SC:N/SI:N/SA:N (6.9, Medium)
- **Priority:** Medium
- **Why this priority:** any holder of a link replays it over the internet with no condition, but the damage is limited to skipped ads and extra egress on free-tier quality, with no data or money path behind it yet.
- **Upholds:** V. Paid quality and the ad wait are enforced by the server, IV. Every expensive job has a ceiling that no single client can hold
- **Fix:** deliver NOWVI-18: add a random nonce claim to each token and record it on first use (Postgres table with the nonce as primary key and its `exp`, or an in-memory map pruned by `exp` while there is one replica). A second use answers `303 /?erro=expired`, except a short grace window (about 60 s) for the "Baixar de novo" retry from the same client.
- **References:** [CWE-294: Authentication Bypass by Capture-replay](https://cwe.mitre.org/data/definitions/294.html)

### Client IP trusted from forwarding headers

- **Category:** Reliance on untrusted input for a security decision, IP spoofing of the rate-limit key (CWE-348)
- **CVSS:** CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:N/VI:N/VA:L/SC:N/SI:N/SA:N (6.3, Medium)
- **Priority:** Medium
- **Why this priority:** the limiter is internet-facing, but it only falls if Railway's edge forwards a client-sent `X-Real-IP` (not confirmed by detect), and the global job semaphore still caps the total load.
- **Upholds:** IV. Every expensive job has a ceiling that no single client can hold
- **Fix:** first confirm on the deployed API whether a forged `X-Real-IP` survives the edge. Then trust only the segment Railway's edge itself appends (the last `X-Forwarded-For` entry, or `X-Real-IP` only if the edge is proven to overwrite it), and fall back to the socket peer otherwise. Document the decision in the spec's "Proteções" section.
- **References:** [CWE-348: Use of Less Trusted Source](https://cwe.mitre.org/data/definitions/348.html)

### Facebook HD format offered as free

- **Category:** Business logic flaw, paid tier given away (CWE-840)
- **CVSS:** CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N (6.3, Medium)
- **Priority:** Medium
- **Why this priority:** any visitor gets it from a public Facebook link, but only when Facebook's unsized `hd` file is really 1080p, and the loss is the R$ 2 per video, not data.
- **Upholds:** V. Paid quality and the ad wait are enforced by the server
- **Fix:** never sign a free token for a format whose size is unknown and could be Full HD. Offer Facebook's unsized `hd` as `full_hd` (no token) and keep only `sd` free until yt-dlp reports its height; update `NOWVI-22-formats.md` with the rule.
- **References:** [CWE-840: Business Logic Errors](https://cwe.mitre.org/data/definitions/840.html)

### Rate-limited download answers in JSON

- **Category:** Improper handling of exceptional conditions, error contract break (CWE-755)
- **CVSS:** CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:A/VC:N/VI:N/VA:L/SC:N/SI:N/SA:N (2.1, Low)
- **Priority:** Low
- **Why this priority:** it only hits a visitor who already exceeded the limit, and the cost is a confusing page, no data or money exposure.
- **Upholds:** VI. Errors leave as fixed codes, never as server text
- **Fix:** in the rate-limit middleware, when the request is `GET /api/download`, answer the same `303` to `<first WEB_ORIGIN>/?erro=rate_limited` that the download handler uses (extract the redirect into one helper both call). The web already maps `rate_limited`.
- **References:** [CWE-755: Improper Handling of Exceptional Conditions](https://cwe.mitre.org/data/definitions/755.html)

### API responses without browser security headers

- **Category:** Security misconfiguration, missing response headers (CWE-693), sensitive data in a cacheable response (CWE-524)
- **CVSS:** CVSS:4.0/AV:N/AC:H/AT:P/PR:N/UI:P/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N (2.3, Low)
- **Priority:** Low
- **Why this priority:** exploiting it needs a shared cache or a direct load of an API response plus a visitor's action, and what leaks is a 15-minute free-tier token.
- **Upholds:** VIII. Browsers get a restrictive policy on every response
- **Fix:** add one header layer on the API router with `tower-http`'s `set-header` feature (the crate is already a dependency): `X-Content-Type-Options: nosniff`, `Cache-Control: no-store` on every `/api/*` response, and `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`. Keep the download handler's own `Content-Type` and `Content-Disposition`.
- **References:** [CWE-693: Protection Mechanism Failure](https://cwe.mitre.org/data/definitions/693.html), [CWE-524: Use of Cache Containing Sensitive Information](https://cwe.mitre.org/data/definitions/524.html), [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)

### Web CSP allows inline scripts and any https frame

- **Category:** Security misconfiguration, permissive Content Security Policy (CWE-693)
- **CVSS:** CVSS:4.0/AV:N/AC:H/AT:P/PR:N/UI:P/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N (2.3, Low)
- **Priority:** Low
- **Why this priority:** it is defense in depth: detect found no XSS sink today, so it only matters once one appears, and then a visitor must open the page.
- **Upholds:** VIII. Browsers get a restrictive policy on every response
- **Fix:** narrow `frame-src` from `https:` to the ad network hosts the banner actually frames. Then move `script-src` to a per-request nonce with `'strict-dynamic'` through a Next `proxy.ts`, dropping `'unsafe-inline'`, and give the ad iframe's inline `atOptions` script a hash or the same nonce. The nonce makes the pages render per request, so weigh it against static SEO pages before adopting; until then keep the JSON-LD and `?erro=` handling as they are (static copy, closed enum).
- **References:** [CWE-693: Protection Mechanism Failure](https://cwe.mitre.org/data/definitions/693.html), [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

### HSTS missing on web and API

- **Category:** Cleartext transmission, missing HSTS (CWE-319)
- **CVSS:** CVSS:4.0/AV:A/AC:H/AT:P/PR:N/UI:P/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N (2.1, Low)
- **Priority:** Low
- **Why this priority:** the attacker must share the visitor's network and catch the first cleartext request, and the site holds no login or personal data to steal.
- **Upholds:** VIII. Browsers get a restrictive policy on every response
- **Fix:** send `Strict-Transport-Security: max-age=63072000; includeSubDomains` from the Next `securityHeaders` list and from the API header layer, starting with a short `max-age` (one day) for the first deploy. Leave `preload` out until the domain is committed to HTTPS for good.
- **References:** [CWE-319: Cleartext Transmission of Sensitive Information](https://cwe.mitre.org/data/definitions/319.html), [OWASP HSTS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html)

### Ad consent cannot be withdrawn

- **Category:** Privacy and consent violation, LGPD art. 8 §5 (CWE-359)
- **CVSS:** CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:A/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N (2.1, Low)
- **Priority:** Low
- **Why this priority:** it only affects a visitor who accepted and later wants out, and the exposure is ad-network cookies, but it is a legal obligation the charter names.
- **Upholds:** VII. Personal data stays out of logs, and ads wait for consent (LGPD)
- **Fix:** add a "Preferências de cookies" link to the footer that clears the stored choice and shows the banner again (the ad slot already re-reads consent through `useConsent`). Rewrite the privacy text to match what is processed: no analytics cookies, ad cookies only after consent, and the IP kept in memory only for rate limiting.
- **References:** [CWE-359: Exposure of Private Personal Information to an Unauthorized Actor](https://cwe.mitre.org/data/definitions/359.html)

### Vulnerable shadcn CLI in production dependencies

- **Category:** Use of a vulnerable third-party component (CWE-1395), prototype pollution in `deepmerge` (GHSA-gcqx-w48m-w2h4)
- **CVSS:** CVSS:4.0/AV:L/AC:H/AT:P/PR:N/UI:N/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N (2.1, Low)
- **Priority:** Low
- **Why this priority:** the vulnerable code runs only at build time inside the CLI, not in the served app, and the three advisories are rated low upstream.
- **Upholds:** IX. What ships is pinned, minimal and audited
- **Fix:** move `shadcn` to `devDependencies` (the build still installs it for the CSS import) and confirm `npm audit --omit=dev` comes back clean. Add `npm audit --omit=dev` and `cargo audit` (install `cargo-audit`, or use `cargo deny`) to a CI job or to the release checklist before every PR to `main`.
- **References:** [CWE-1395: Dependency on Vulnerable Third-Party Component](https://cwe.mitre.org/data/definitions/1395.html), [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)

### Container base images on mutable tags

- **Category:** Inclusion of functionality from an untrusted control sphere, unpinned base image (CWE-829)
- **CVSS:** CVSS:4.0/AV:N/AC:H/AT:P/PR:H/UI:N/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N (2.1, Low)
- **Priority:** Low
- **Why this priority:** it needs the upstream tag publisher to be compromised or to ship a breaking change, which is rare, and the yt-dlp binary is already pinned by checksum.
- **Upholds:** IX. What ships is pinned, minimal and audited
- **Fix:** pin every `FROM` in both Dockerfiles to `tag@sha256:<digest>`, keeping the tag for readability, and refresh the digests on the same schedule as the yt-dlp rebuild (NOWVI-16).
- **References:** [CWE-829: Inclusion of Functionality from Untrusted Control Sphere](https://cwe.mitre.org/data/definitions/829.html)

### Railway config files not applied

- **Category:** Security misconfiguration, configuration drift (CWE-1188)
- **CVSS:** CVSS:4.0/AV:N/AC:L/AT:P/PR:H/UI:N/VC:N/VI:N/VA:L/SC:N/SI:N/SA:N (2.1, Low)
- **Priority:** Low
- **Why this priority:** it takes a broken push to `main` to matter, and the damage is downtime, not data.
- **Upholds:** IX. What ships is pinned, minimal and audited
- **Fix:** in each Railway service set the config-as-code path to `apps/web/railway.toml` and `crates/nowvi-api/railway.toml` (or move the settings into the dashboard and delete the files), then confirm on the next deploy that the healthcheck and restart policy show up in the service settings. Record which source is authoritative in the README.
- **References:** [CWE-1188: Initialization of a Resource with an Insecure Default](https://cwe.mitre.org/data/definitions/1188.html)

### Docker build context lets local env files in

- **Category:** Insertion of sensitive information into an externally accessible artifact (CWE-538)
- **CVSS:** CVSS:4.0/AV:L/AC:H/AT:P/PR:H/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N (1.8, Low)
- **Priority:** Low
- **Why this priority:** Railway builds from git, where these files are ignored, so only an image built and pushed from a developer's machine is exposed.
- **Upholds:** I. Secrets live only in the environment, never in code or the web bundle
- **Fix:** change the root `.dockerignore` entry to `**/.env*` with `!**/.env.example`, so no local env file reaches either build context.
- **References:** [CWE-538: Insertion of Sensitive Information into Externally-Accessible File or Directory](https://cwe.mitre.org/data/definitions/538.html)

## Open questions

- Whether Railway's edge overwrites a client-sent `X-Real-IP`, propagates backpressure, and caps request duration (listed under Not determined in the detect map); the ratings of "Client IP trusted from forwarding headers" and "Download slot held by a client that stops reading" assume the worst case until a test against the deployed API settles it.
- `cargo audit` was never run, so the Rust dependency tree has no advisory check yet; it is covered by the fix for "Vulnerable shadcn CLI in production dependencies" once the tool is installed.
