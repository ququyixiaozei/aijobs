# jobboard-engine — niche job board (SEO accumulation asset)

Decisions: **D068** (model = self-serve SEO accumulation asset), **D070** (niche = AI-infra/GPU eng), **D072** (commit + build).
First niche: **AI Infrastructure & GPU Engineering Jobs** (GPU/CUDA/ML-systems/inference/performance roles at AI labs & infra startups).

## Why this shape
- **脱离 AI 也能启动**：job boards are a decades-old business. **有 AI 大幅加速**：one person + AI runs what used to need an editorial team. **可快速复制**：the niche lives in ONE file (`ingest/niche.config.mjs`) — clone the engine to evals/RAG/etc. by editing it.
- Distribution = Google organic pull (no promotion / no 人脉). Monetization = self-serve (employers pay to post/feature). Moat = the continuously-maintained, comprehensive, fresh dataset (ChatGPT can't reproduce it).

## Proven (live API probes, 2026-05-29)
**27 companies verified** returning real jobs from public ATS APIs (no auth), **~221 live AI-infra matches** — the board launches with hundreds of jobs:
- **Greenhouse (16)**: Anthropic 43, Databricks 26, CoreWeave 21, Graphcore 20, Tenstorrent 14, Nebius 12, Scale 9, Applied Intuition 8, Together 7, xAI 6, SambaNova 4, RunPod 3, Vast.ai 3, Fireworks 2, Lightmatter 2, Lightning 1
- **Ashby (10)**: Baseten 10, Etched 6, Cursor 5, Lambda 4, Prime Intellect 3, Character.AI 2, SF Compute 2, FluidStack 2, Anyscale 1, Cartesia 1
- **Lever (1)**: Mistral 4

All three ATS endpoint formats confirmed. Add more by finding a company's ATS slug (still-to-add: Cohere / Hugging Face / Perplexity / Groq / Cerebras / Modal — custom sites, manual lookup).

## Architecture (v1 = file-based, no DB — keep it minimal)
```
ingest/            Node ESM scraper (runs on cron; writes data/jobs.json)
  niche.config.mjs   ← the ONLY file to change to clone to a new niche
  companies.mjs      ← seed list (ats + token)
  sources.mjs        ← Greenhouse / Lever / Ashby adapters (public JSON)
  run.mjs            ← orchestrate: fetch → filter → dedupe → data/jobs.json
data/jobs.json     generated job feed (the static source the site reads)
web/  (next)       Next.js (ISR): listings + job detail (JobPosting JSON-LD) + category pages + sitemap
```
v2 (only when monetizing): add Postgres for employer-submitted/paid posts.

## Run the ingest
```
node ingest/run.mjs        # (needs Node 18+, which has global fetch)
```
Fix any company printed `FAIL` (wrong token) — check that company's careers URL for its real ATS slug.

## SEO rules (from research, non-negotiable)
- `JobPosting` JSON-LD on each **job leaf page** (title, hiringOrganization, jobLocation, datePosted, validThrough, baseSalary, employmentType). ZipRecruiter saw +450% CTR from schema.
- Do NOT put JobPosting schema on list/category pages.
- Category pages (e.g. `/remote-gpu-jobs`, `/cuda-jobs`, `/ml-performance-jobs`) win on long-tail via curation/filtering.
- Expired jobs: set `validThrough` to past or return 410 — stale postings get penalized.

## Honest status (the bet)
Profit logic is **真 but low-base-rate, back-loaded, distribution under Google-for-Jobs pressure** (decisions D071). The only real demand test = ship + watch Google Search Console impressions for ~8-12 weeks. Cash downside ≈ one domain ($12); everything else free tier. Engine is reusable, so a dead niche just gets re-pointed.

## Roadmap (tasks)
1. ✅ scaffold + ingest engine (this)  2. ⏳ Next.js site (listings/detail/category + schema)  3. sitemap/robots/expire  4. deploy (Vercel + cron) + handoff  5. Search Console = validation gate  6. monetization stub (Payoneer/MoR) once traffic exists.
