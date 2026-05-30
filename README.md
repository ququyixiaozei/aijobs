# warpjobs

**Live site → [warpjobs.com](https://warpjobs.com)**

An open-source, daily-refreshed job board for **GPU / CUDA / ML-systems / inference / performance-engineering** roles, aggregated straight from AI-lab and infrastructure companies' public ATS feeds. This repository is the scraper and static-site engine behind it.

- **~115 roles from 23 companies**, refreshed daily via CI.
- **Feeds:** [RSS](https://warpjobs.com/feed.xml) · [JSON](https://warpjobs.com/jobs.json)
- No accounts, no tracking, no résumé upload. Every listing links straight to the company's own application page.
- `JobPosting` structured data on every role.

## How it works

```
ingest/  →  fetch public ATS JSON  →  filter to the niche  →  dedupe  →  data/jobs.json
app/     →  Next.js (static export) reads data/jobs.json  →  out/  →  GitHub Pages
```

A GitHub Actions cron runs the scraper daily, commits the refreshed feed, rebuilds the static site, and deploys it. There is no server, database, or backend at runtime.

## Data sources

Public, unauthenticated JSON endpoints from three ATS platforms:

- **Greenhouse** — `boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true`
- **Lever** — `api.lever.co/v0/postings/{token}?mode=json`
- **Ashby** — `api.ashbyhq.com/posting-api/job-board/{token}`

Currently aggregating from companies including Anthropic, CoreWeave, xAI, Databricks, Tenstorrent, Together AI, Baseten, Scale AI, Nebius, Cursor, Lambda, Mistral, and more (see `ingest/companies.mjs`).

## Run it locally

```bash
npm install
npm run ingest      # fetch + filter → data/jobs.json   (Node 18+)
npm run dev         # preview the site
npm test            # unit + security regression tests
npm run build       # static export → out/
```

## Point it at your own companies / niche

The engine is niche-agnostic — adapting it is two files:

- `ingest/companies.mjs` — the seed list (`{ name, ats, token }`). Find a company's ATS slug from its careers-page URL.
- `ingest/niche.config.mjs` — the role/domain keyword filters and the category pages. Change these to retarget the board to a different specialty.

## Architecture notes

- **`lib/derive.js`** — pure, IO-free helpers (slug, region, salary parsing, freshness), unit-tested.
- **Freshness** — postings older than 90 days are archived automatically.
- **Dedup** — the same role across multiple locations collapses to one entry.
- **Security** — job descriptions come from third-party feeds and are treated as untrusted: HTML is allowlist-sanitized at the ingest boundary, and all JSON-LD is output-escaped. See [`SECURITY.md`](./SECURITY.md).
- **Tests gate deploys** — `npm test` runs in CI before any build/deploy.

## License

See `LICENSE` if present; otherwise all rights reserved by the author.
