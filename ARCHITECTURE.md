# Architecture & working conventions

A niche **SEO accumulation asset**: aggregate AI-infra/GPU jobs from public ATS APIs → a fast, scannable, static board that ranks on Google. Built to long-term-project standards (tracked backlog, tests, CI gate). No backend.

## Data flow
```
ingest/ (Node ESM, no deps, runs in CI daily)
  niche.config.mjs   ← the ONLY file to change to clone to a new niche (filter + categories)
  companies.mjs      ← seed list {name, ats, token}
  sources.mjs        ← Greenhouse/Lever/Ashby adapters (public JSON, retry+timeout, HTML-decode)
  run.mjs            ← fetch all → filter to niche → dedupe sources → data/jobs.json
        │
        ▼
data/jobs.json       generated feed (committed by CI; the single data artifact)
        │
lib/
  derive.js          ← PURE, IO-free helpers (parse/normalize/format, countryOf, deriveTags) — unit-tested
  company-meta.js    ← hand-curated one-line factual company blurbs keyed by kebab(name) (company page + hiringOrganization.description)
  jobs.js            ← reads data/jobs.json, derives fields, freshness-archives (>90d),
                       dedupes (same company+normalized-title → 1 row, locations[]),
                       exposes getAllJobs / getBrowserJobs (slim) / getCategoriesLite / getJobBySlug,
                       company+region+level+remote slicers, statsFor() aggregator,
                       getSalaryReport() (median comp by specialty/level/company over
                       reliable non-broad bands; segments <MIN_SALARY_N suppressed),
                       and the isIndexable* thresholds (see Conventions)
        │
app/ (Next.js 15, output: 'export' → static HTML)
  layout.js          header + footer (source/build-time/feeds/hub nav)
  page.js            home: server-loads → <JobBrowser> (client)
  JobBrowser.js      "use client": search / region·visa·salary filters / sort / save(localStorage) / density
  StatStrip.js       dataset-stat strip (computed facts only) shared by all hub pages
  companies-hiring/  FLAGSHIP data-hub: leaderboard (company × specialty × salary/visa/remote) + editorial
  [category]/        per-category landing (stat-strip + per-category editorial + JobBrowser)
  company/[slug]/    per-company hub (+ /companies index)
  region/[slug]/     region hubs (europe); level/[slug]/ level hubs (senior, staff); remote/  page
  salaries/          comp data-hub: median pay by specialty/level/company (getSalaryReport); index+sitemap gated on live sample size
  jobs/[slug]/       leaf page + JobPosting JSON-LD (future-dated validThrough + addressCountry) + related-roles
  sitemap.js robots.js feed.xml/route.js jobs.json/route.js  (force-static)
  (public/llms.txt   curated entry-point for LLM/AI-Overview crawlers)
```

## Conventions
- **Pure logic lives in `lib/derive.js`** and must stay IO-free + unit-tested (`test/derive.test.mjs`). Anything touching `fs`/`env`/data shape goes in `lib/jobs.js`.
- **basePath**: internal links use `BP` (= `NEXT_PUBLIC_BASE_PATH`). `/aijobs` for the github.io preview; `''` for a custom domain.
- **Categories are TAGS, not exclusive bins**: a job can match several (title-based). Counts in `getCategoriesLite`.
- **Freshness**: postings older than `STALE_DAYS` (90) are archived (excluded) — protects signal on a "daily" board.
- **Index thresholds = ONE source of truth (doorway guardrail)**: `isIndexableCompany(<4)` / `isIndexableSlice(<10)` in `lib/jobs.js` drive **both** per-page `robots:{index:false,follow:true}` (via `robotsFor`, in `generateMetadata`) **and** sitemap inclusion. Thin slices stay live + `follow` (users + internal-link equity) but out of the index *and* out of `sitemap.xml`. On a low-authority domain a cluster of thin near-duplicate pages can suppress sitewide trust — so any new programmatic page MUST gate through these helpers in *both* places, or robots and sitemap will drift.
- **Programmatic editorial must be non-template**: stat-strips (computed numbers) may be templated — that's data, not content — but the prose on each hub/category page must vary in the majority of its visible text (different named companies, different commentary). Two pages that diff <30% are scaled-content. Per-category prose lives in `niche.config.mjs`; per-hub prose is inline in the page.
- **Every fix references a `BACKLOG.md` id** in its commit message (e.g. `fix(B-03): ...`).

## Extend
- **Add a company**: append `{name, ats, token}` to `companies.mjs`; `npm run ingest` confirms (fix FAIL tokens).
- **Add a category**: add `{slug, name, match, blurb, editorial}` to `categories` in `niche.config.mjs` (editorial = non-template prose).
- **Add a hub page** (region/level/etc.): slice with a `getJobsBy*` helper → render `StatStrip` + non-template editorial + `<JobBrowser>`; in `generateMetadata` gate index via `robots: robotsFor(isIndexableSlice(count))`, **and** add the URL to `sitemap.js` behind the same `isIndexableSlice` check (keep the two in lock-step).
- **Clone to a new niche**: copy the repo, rewrite `niche.config.mjs` + `companies.mjs`.

## Workflow / gates
- `npm test` (node test runner, zero-dep) — runs in CI **before** build; failure blocks deploy.
- `npm run build` — static export; type/compile errors block deploy.
- CI (`.github/workflows/deploy.yml`): daily + on push → ingest → test → build → deploy to GitHub Pages.
- **The build is the deploy gate** — broken code cannot publish.
```
npm install && npm run ingest && npm test && npm run build   # full local check
```
