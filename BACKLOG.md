# Backlog — tracked fixes & improvements

Single source of truth for what's done / pending. Status: ✅ done · 🔧 in progress · ⏳ deferred (needs ongoing infra) · 🧊 later.
**Convention:** every change references its id in the commit message, e.g. `fix(B-21): salary column placeholder`.

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
| B-44 | Custom domain + Search Console (start the validation clock) | user action — buy domain → switch basePath to root |
