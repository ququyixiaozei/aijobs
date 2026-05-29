# Security

WarpJobs is a **static site** (Next.js `output: export`) hosted on GitHub Pages.
There is **no backend, no database, no user accounts, and no personal data
stored** — listings link out to the original posting on each company's career
page. That shape removes most of the usual attack surface; the items below are
what actually matters here.

## Threat model & mitigations

### 1. Untrusted third-party HTML (primary risk) — mitigated
Job descriptions are fetched from third-party ATS APIs (Greenhouse, Lever,
Ashby) and rendered on detail pages. A malicious or compromised posting could
otherwise inject `<script>`, event handlers (`onerror`/`onclick`), `<iframe>`,
tracking pixels, or phishing markup onto the `warpjobs.com` origin.

- All ingested HTML is **allowlist-sanitized at the ingest boundary**
  (`ingest/sanitize.mjs`, using `sanitize-html`) before it is written to
  `data/jobs.json`. Only formatting tags survive; scripts, event handlers,
  inline styles, `javascript:`/`data:` URLs, iframes, and images are stripped.
  Surviving links are forced to `rel="noopener noreferrer nofollow ugc"`.
- This is covered by **security regression tests** (`test/sanitize.test.mjs`)
  that run in the CI gate — a change that reopens the XSS vector fails the
  build before deploy.

### 2. Transport security
- HTTPS is provided by GitHub Pages (Let's Encrypt). "Enforce HTTPS" (HTTP→HTTPS
  redirect + HSTS) is enabled once the custom-domain certificate is provisioned.

### 3. Content-Security-Policy (defense-in-depth) — partial by host constraint
- A CSP is delivered via `<meta http-equiv>` in the root layout: `default-src
  'self'`, `object-src 'none'`, `base-uri 'self'`, and same-origin-only
  script/style/img/connect. This blocks loading external scripts/objects and
  `<base>` hijacking on top of the sanitizer above.
- **Known limitation:** GitHub Pages cannot set custom HTTP response headers.
  Directives that only work as a *header* — `frame-ancestors` (clickjacking),
  `X-Frame-Options`, `X-Content-Type-Options` — therefore cannot be enforced
  here. `script-src` must include `'unsafe-inline'` because static export has
  no server to issue per-request nonces. These are accepted trade-offs of the
  static-host choice; the sanitizer is the real XSS control.

### 4. Supply chain
- Dependencies are pinned via `package-lock.json`; CI installs with `npm ci`
  (reproducible, integrity-checked) and runs `npm test` as a deploy gate.
- `overrides` pins `postcss` to a patched version (a transitive advisory in the
  Next build toolchain that is **not runtime-exploitable** here — postcss only
  processes our own trusted CSS at build time, never attacker-controlled CSS).
- **Dependabot** opens weekly PRs for npm and GitHub Actions updates.
- The deploy workflow uses only first-party `actions/*` and runs with
  least-privilege permissions (`contents`/`pages`/`id-token: write`).
- No secrets are stored in the repo: every ATS endpoint is public and unauthenticated.

## Reporting a vulnerability
Open a private report via **GitHub Security Advisories** on this repository, or
file an issue (omit exploit details for anything sensitive). This is a solo
project; expect a best-effort response.
