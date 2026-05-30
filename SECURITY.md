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
- **Beyond the description:** the description is the only third-party value
  rendered *as HTML*. Other third-party fields (job **title**, apply **url**)
  are not HTML but are embedded in the JobPosting / Breadcrumb **JSON-LD**
  `<script>` blocks. Since `JSON.stringify` does **not** escape `<`, a title or
  url containing `</script>…` would otherwise break out of the script element
  and run inline JS — a stored-XSS vector the HTML sanitizer alone does **not**
  cover. All JSON-LD is therefore serialized through `lib/jsonld.js` (`ld()`),
  which escapes `<`/`>`/`&` so no field can break out, guarded by
  `test/jsonld.test.mjs` in the CI gate. The apply `url` is additionally
  restricted to `http(s)` at ingest.

### 2. Transport security
- HTTPS is provided by GitHub Pages (Let's Encrypt). "Enforce HTTPS" (HTTP→HTTPS
  redirect + HSTS) is enabled once the custom-domain certificate is provisioned.

### 3. Content-Security-Policy (defense-in-depth) — partial by host constraint
- A CSP is delivered via `<meta http-equiv>` in the root layout: `default-src
  'self'`, `object-src 'none'`, `base-uri 'self'`, and same-origin-only
  script/style/img/connect. It blocks loading **external** scripts/objects and
  `<base>` hijacking.
- **It does NOT stop an injected *inline* script.** Static export has no server
  to issue per-request nonces, so `script-src` must include `'unsafe-inline'`.
  The real XSS controls are therefore the **ingest HTML sanitizer** and the
  **JSON-LD output escaping** (§1) — *not* the CSP. The CSP is a secondary layer
  that limits blast radius (no external exfiltration host, no `<base>` hijack).
- **Known limitation:** GitHub Pages cannot set custom HTTP response headers.
  Directives that only work as a *header* — `frame-ancestors` (clickjacking),
  `X-Frame-Options`, `X-Content-Type-Options`, header-based HSTS preload —
  cannot be enforced here. Near-zero impact for this site: no auth, sessions,
  cookies, or PII, so there is nothing to steal via clickjacking/MIME-sniffing;
  the worst case is a forged copy of a public board. Accepted trade-off of
  static hosting.

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
