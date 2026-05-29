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
  derive.js          ← PURE, IO-free helpers (parse/normalize/format) — unit-tested
  jobs.js            ← reads data/jobs.json, derives fields, freshness-archives (>90d),
                       dedupes (same company+normalized-title → 1 row, locations[]),
                       exposes getAllJobs / getBrowserJobs (slim) / getCategoriesLite / getJobBySlug
        │
app/ (Next.js 15, output: 'export' → static HTML)
  layout.js          header + footer (source/build-time/feeds/issues)
  page.js            home: server-loads → <JobBrowser> (client)
  JobBrowser.js      "use client": search / region·visa·salary filters / sort / save(localStorage) / density
  [category]/page.js SEO landing pages per category (JobBrowser pre-filtered)
  jobs/[slug]/page.js leaf page + JobPosting JSON-LD (the SEO unit + Google Jobs eligibility)
  sitemap.js robots.js feed.xml/route.js jobs.json/route.js  (force-static)
```

## Conventions
- **Pure logic lives in `lib/derive.js`** and must stay IO-free + unit-tested (`test/derive.test.mjs`). Anything touching `fs`/`env`/data shape goes in `lib/jobs.js`.
- **basePath**: internal links use `BP` (= `NEXT_PUBLIC_BASE_PATH`). `/aijobs` for the github.io preview; `''` for a custom domain.
- **Categories are TAGS, not exclusive bins**: a job can match several (title-based). Counts in `getCategoriesLite`.
- **Freshness**: postings older than `STALE_DAYS` (90) are archived (excluded) — protects signal on a "daily" board.
- **Every fix references a `BACKLOG.md` id** in its commit message (e.g. `fix(B-03): ...`).

## Extend
- **Add a company**: append `{name, ats, token}` to `companies.mjs`; `npm run ingest` confirms (fix FAIL tokens).
- **Add a category**: add `{slug, name, match}` to `categories` in `niche.config.mjs`.
- **Clone to a new niche**: copy the repo, rewrite `niche.config.mjs` + `companies.mjs`.

## Workflow / gates
- `npm test` (node test runner, zero-dep) — runs in CI **before** build; failure blocks deploy.
- `npm run build` — static export; type/compile errors block deploy.
- CI (`.github/workflows/deploy.yml`): daily + on push → ingest → test → build → deploy to GitHub Pages.
- **The build is the deploy gate** — broken code cannot publish.
```
npm install && npm run ingest && npm test && npm run build   # full local check
```
