# Backlog — tracked fixes & improvements

Single source of truth for what's done / pending. Status: ✅ done · 🔧 in progress · ⏳ deferred (needs ongoing infra) · 🧊 later.
**Convention:** every change references its id in the commit message, e.g. `fix(B-21): salary column placeholder`.

## Product QA + SEO + features pass (2026-05-30)
> All UI changes are **build- and HTML-verified but not browser-eyeballed** (no browser in this env) — please spot-check the live site visually.

| id | item | status |
|----|------|--------|
| B-52 | Crawlable category links (nav pills → real `<a>` + sitewide footer nav) — fixes internal-link crawlability of `/[category]/` pages | ✅ |
| B-53 | Category descriptive blurbs + live counts; homepage dynamic count; per-page canonicals; WebSite + BreadcrumbList JSON-LD | ✅ |
| B-54 | JobPosting `baseSalary` (Google-Jobs salary display, ~68/115 roles) + WebSite SearchAction (sitelinks searchbox) + favicon | ✅ |
| B-55 | Seniority filter (senior/staff+/manager) + recency (≤7d/≤30d) + clear-all + aria-pressed toggles | ✅ |
| B-56 | Employer "Post a role" link → prefilled GitHub issue (captures earliest willingness-to-pay signal, D071 #4) | ✅ |
| B-57 | URL-synced filter/search state (Back restores filters; shareable/bookmarkable views) | ✅ |
| B-58 | Programmatic company pages `/company/[slug]` (27) + `/companies` index; job→company links; sitemap 124→152 pages | ✅ |
| B-59 | Skill/tech tags (triton/rust/c++/k8s…) derived at ingest for search + filter | ⏳ medium; needs ingest derivation + UI |
| B-60 | Per-category RSS + email/keyword alerts | ⏳ email needs a backend; per-category RSS doable later |
| B-61 | Custom OG share image (PNG) | 🧊 needs a design asset (text card works now) |
| B-62 | Light theme | 🧊 low priority (audience skews dark) |

## Security & launch hardening (2026-05-30)
| id | item | status |
|----|------|--------|
| B-46 | Sanitize untrusted third-party job HTML at ingest (allowlist `ingest/sanitize.mjs`) + 6 CI security-regression tests (`test/sanitize.test.mjs`) — closes stored-XSS via ATS descriptions | ✅ |
| B-47 | CSP via `<meta http-equiv>` (default-src self, object-src none, base-uri self) + referrer policy + `SECURITY.md` (honest re: GH-Pages can't set headers → no frame-ancestors/HSTS/X-CTO) | ✅ |
| B-48 | Supply chain: `overrides` pin postcss → **0 vulns**; CI `npm install`→`npm ci` (reproducible); `dependabot.yml` (npm + github-actions weekly); verified first-party `actions/*` + least-priv perms | ✅ |
| B-49 | Open Graph + Twitter card + `metadataBase` for clean link unfurls when shared (promo) | ✅ |
| B-50 | Custom OG share **image** (PNG) for richer cards | 🧊 needs a design asset; text card works for now |
| B-51 | IndexNow auto-ping in deploy workflow (Bing/Yandex instant indexing) | ⏳ wire after launch |

## Current sprint — design critique round 3 (2026-05-29)
| id | item | status |
|----|------|--------|
| B-21 | Salary as a fixed-width, right-aligned column with a uniform `—` placeholder for no-salary rows (clean vertical band) — *flagged top priority* | ✅ |
| B-22 | Make **compact** the default density + ensure compact vs comfortable is clearly distinct | ✅ |
| B-23 | Reduce stacked left decorations: drop always-on green dot; ★ appears on row hover only | ✅ |
| B-24 | Make "new" a scarce signal: only `today` is accent-colored; 1d/2d plain (no redundant dot) | ✅ |
| B-25 | Group controls into **Filter** (region/salary/visa/saved) vs **View** (sort/density) with a divider | ✅ |
| B-26 | Company mark color: deterministic hash, same company = same color, spread hues to reduce collisions | ✅ |

## Shipped — round 2 (D075)
✅ dedup same-company+title multi-location · ✅ region multi-filter (US/EU/UK/Remote/APAC) · ✅ visa-sponsor toggle · ✅ salary-min filter + sort-by-salary · ✅ save/star (localStorage) + visited dimming · ✅ density toggle · ✅ RSS `/feed.xml` + JSON `/jobs.json` · ✅ enriched footer (source/method/build-time/issues) · ✅ design tokens · ✅ pipeline-injected timestamp · ✅ header/list separator · ✅ empty state.

## Shipped — round 1 (D074)
✅ instant search (`/`) · ✅ aligned columns · ✅ removed default-blue links · ✅ monospace metadata · ✅ reading-width cap · ✅ spacing scale · ✅ company-mark · ✅ 90-day freshness archive · ✅ salary extraction · ✅ key-facts detail header · ✅ category counts · ✅ single accent · ✅ JobPosting JSON-LD.

## Deferred — ops/CI (needs ongoing infrastructure, not one-shot)
| id | item | why deferred |
|----|------|--------------|
| B-31 | Dead-link auto-check: cron revisits each source URL, delists/greys 404s, tracks failure-rate | needs a scheduled checker job + state |
| B-32 | Scrape silent-failure alerting + anomaly detection (job-count spike/drop) | needs alerting channel + baselines |
| B-33 | Location alias normalization → canonical city/country enum (only region-bucketing done) | ongoing data-cleaning task |
| B-34 | Email/keyword subscription | needs backend/email service (RSS+JSON shipped as the no-backend alternative) |
| B-35 | Per-company SEO landing pages (`/company/[x]`) | SEO expansion; company filter/search covers it for now |
| B-36 | Salary currency / equity-vs-base disambiguation | needs richer parsing; shown as-published for now |

## Later / icebox
| id | item | trigger |
|----|------|---------|
| B-41 | TypeScript migration | when the surface stabilizes — don't risk a mid-flight rewrite of a working site |
| B-42 | ESLint/Prettier config + CI lint step | low-risk; add next (build already typechecks) |
| B-43 | Monetization: self-serve employer paid post (Payoneer/MoR) | only after real SEO traffic exists (decisions D071) |
| B-44 | Custom domain **warpjobs.com** | ✅ wired + **HTTPS cert UNSTUCK (2026-05-30)**. Root cause (workflow-verified): the stuck `cert_state=null` (cert object absent) meant LE was **never enqueued**; my earlier same-value `cname` PUT fired **no change event** = no-op. **Fix = force a real `null→value` change**: `gh api --method PUT .../pages -F cname=null -F build_type=workflow` (JSON-null via `-F`, NOT `-f cname=` empty-string), then re-add `-f cname=warpjobs.com -f build_type=workflow`. Result: cert object materialized `state=new` → provisioning enqueued. Watcher `bprqv6gfz` auto-enables `https_enforced` once cert issued AND served leaf CN=warpjobs.com (curl verify=0). DNS never touched; ~10s 404 gap only. **DoNot**: never `DELETE /pages` (nukes whole site); never edit `out/CNAME` (ignored for build_type=workflow); never enforce HTTPS before served cert verified. |
| B-45 | Search Console + submit sitemap (start the validation clock) | ✅ domain verified + sitemap accepted (over HTTP). Re-confirm fetch over HTTPS once cert green. |
