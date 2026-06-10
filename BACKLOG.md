# Backlog — tracked fixes & improvements

Single source of truth for what's done / pending. Status: ✅ done · 🔧 in progress · ⏳ deferred (needs ongoing infra) · 🧊 later.
**Convention:** every change references its id in the commit message, e.g. `fix(B-21): salary column placeholder`.

## Google-for-Jobs eligibility + distribution rails (2026-06-10)
> Re-review finding: 28 days of GSC showed ZERO job-listing rich-result impressions (Search Appearance report empty) — Google for Jobs was never actually reached. Two markup gaps + the never-built Indexing API push are the cheapest untested levers; organic ranking (D102) stays falsified.

| id | item | status |
|----|------|--------|
| B-66 | **JobPosting remote eligibility fix**: TELECOMMUTE postings (69/231) carried neither `applicantLocationRequirements` nor `jobLocation` → ineligible per Google docs. Now emit `applicantLocationRequirements` (via new `countryNameOf`, unit-tested) + `jobLocation` when derivable; `directApply: false` added (link-out is not on-page apply). | ✅ |
| B-67 | **Google Indexing API pipeline** (`ingest/google-indexing.mjs` + deploy.yml step): zero-dep RS256 JWT, pushes new `/jobs/` URLs as URL_UPDATED + vanished ones as URL_DELETED, 190/day cap, state in `data/gindex-state.json` (CI-committed). Auth = **keyless WIF** (org policy blocks JSON keys; repo vars `GCP_WORKLOAD_IDENTITY_PROVIDER`/`GCP_SERVICE_ACCOUNT`, DEPLOY.md 14-B); ownership = **SA self-verify via Site Verification API** (`google-site-verify.mjs`, 14-C — GSC UI rejects SA emails) → verified owner ✓ 2026-06-10. Runs on schedule/dispatch only (push-triggered runs burned 194/200 daily quota on pre-ownership 403s). First full push lands at the next PT-midnight quota window. | ✅ operational |
| B-68 | **Aggregator submission feed** `/jobs-feed.xml` (Indeed-style `<source><job>` XML, CDATA-safe, `<url>` → our leaf pages so accepted sources send click traffic here). Enables Jooble/Talent/WhatJobs-class source submissions (submission forms = user-side). | ✅ |

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

## Pre-promotion security audit + IndexNow (2026-05-30)
> Adversarial multi-agent audit (25 agents) before promotion. Verdict: static arch eliminates whole attack classes; **one real bug found+fixed**; rest is operational (user) or accepted static-host limits.

| id | item | status |
|----|------|--------|
| B-63 | **Stored-XSS fix**: job title/url broke out of JSON-LD `<script>` (JSON.stringify doesn't escape `<`; sanitizer only covered description). `lib/jsonld.js ld()` escapes `<`/`>`/`&` at all 5 JSON-LD sinks + CI regression test `test/jsonld.test.mjs` + ingest url http(s) allowlist + SECURITY.md corrected. **Verified live in build (`&` in JSON-LD).** | ✅ |
| B-64 | **IndexNow** auto-indexing: `public/<key>.txt` + `ingest/indexnow.mjs` (reads out/sitemap.xml → pings api.indexnow.org) + deploy.yml step. Bing/Yandex instant-index on every deploy, zero human action (Google unaffected). | ✅ |
| B-65 | **Operational hardening (USER, audit-recommended, user-deprioritized 2026-05-30)**: phishing-resistant 2FA on email+GitHub+Namecheap; Namecheap registrar lock; domain auto-renew. User accepts the residual risk; my one EV-based rec = **Namecheap 2FA + registrar lock** (domain theft = irreversible single point of failure). Not a code blocker. | ⏳ user-deferred |
| B-66 | Pin GitHub Actions to commit SHAs (Dependabot keeps current); optional CAA + DNSSEC; login/uptime/CT monitoring | 🧊 low, later |

## SEO depth pass — programmatic data-hubs + doorway guardrails (2026-05-30, D085)
> HN/Reddit deferred (D084) → pivot to pure SEO accumulation. Two independent research workflows agreed: with only ~115 jobs the win is **depth, not a keyword-permutation farm**. Built the few defensible data-hub pages + the defensive index hygiene that was the biggest live risk. All build/HTML-verified; visual spot-check still wanted.

| id | item | status |
|----|------|--------|
| B-67 | **Flagship `/companies-hiring`** data-hub: live leaderboard (company × per-specialty × remote/visa/salary) + 2-para editorial analysis + dataset stat-strip. The "which companies are hiring" view GFJ structurally can't replicate. Pure aggregation over existing corpus, zero new data. | ✅ |
| B-68 | **Doorway/thin-content guardrails (biggest live fix)**: `isIndexableCompany(<4)` / `isIndexableSlice(<10)` = ONE shared threshold for both per-page `robots:noindex,follow` AND sitemap pruning (no drift). Sitemap dropped ~15 thin company wrappers (23→8 indexed) + ml-systems (8<10). Verified live: thin pages `noindex,follow`, indexed pages clean. | ✅ |
| B-69 | **Category pages enriched**: StatStrip (roles/companies/salary band/visa/remote) + distinct per-category editorial (in `niche.config`, non-template) + top-companies links. ml-systems auto-noindex while <10. | ✅ |
| B-70 | **Company hubs enriched**: hiring snapshot (specialty/level/salary band/visa) + one dataset-derived context line; thin (<4-job) hubs noindex,follow + out of sitemap. | ✅ |
| B-71 | **New hub pages**: `/region/europe` (EU+UK, 21 — UK-only was 9<floor so folded), `/level/senior` (29), `/level/staff` (24), `/remote` (12, self-policing noindex if <10). Each = stat-strip + curated editorial + crawlable list; footer + home + companies-hiring wire them (no orphans). | ✅ |
| B-72 | **JobPosting correctness**: `validThrough` was `postedAt+30` → most listings marked EXPIRED (invalid for Google); now `postedAt+90` floored at `now+7d` (always future) + `addressCountry` via `countryOf()` (GFJ hygiene). | ✅ |
| B-73 | **Anti feed-republishing**: related-roles block on `/jobs/[slug]` (same company, then same specialty) + links up to company/category/who's-hiring — value layer over raw ATS HTML. | ✅ |
| B-74 | `llms.txt` (LLM/AI-Overview discovery, aligned with curated-content thesis) + `StatStrip` component + `statsFor()` aggregator + 6 new CI tests (statsFor/thresholds/countryOf). | ✅ |
| B-75 | **Deferred — earn with GSC data first**: `/gpu-kernel-jobs` (11 roles but heavy overlap w/ gpu+perf = doorway risk); ItemList JSON-LD on hub pages; a UK-specific page once UK clears the floor; more awesome-list PRs (letavocado/MichelML/resource-stream — verify relevance first). | 🧊 later |

## Adversarial review — 10-point external critique (2026-05-31, D086)
> Each critique verified against the live data BEFORE acting (some were real bugs, one was already-correct, two are genuinely user-gated). Data: 11 Nebius jobs had 11 distinct postedAt days but ONE updatedAt day → the "today" bug was confirmed real.

| id | item | status |
|----|------|--------|
| B-76 | **Date integrity (#2/#6)**: `dateOf` preferred `updatedAt` (ATS last-modified, bulk-touched → everything "today"). Now display + sort use `postedDateOf` (real first-published); a separate `activeDateOf` drives freshness so active-but-old posts aren't dropped. Nebius now shows 18d/1mo/2mo/3mo, not all "today". | ✅ |
| B-77 | **Salary integrity (#3)**: placeholder-wide ranges (`isBroadSalary`, ≥2.3×, e.g. Tenstorrent $100K–$500K=5×, 15/68 jobs) are flagged → excluded from salary sort/filter (a $400K+ filter no longer captures them) and from JobPosting `baseSalary`; dimmed + `~`/`·broad` marked in UI; stats band computed from reliable ranges only. | ✅ |
| B-78 | **First-screen diversity (#6)**: default order was one company blanketing the top (the `updatedAt` ties). Fixed by B-76 (real dates scatter them) + `spreadByCompany` cap of ≤2 consecutive rows per company. Verified first-15 now span ~12 companies. | ✅ |
| B-79 | **Brand consistency (#1)**: was split — OG/domain "WarpJobs" vs header/title "ai-infra-jobs". Unified the human wordmark to **"AI Infra Jobs"** everywhere (titles, OG, JSON-LD, llms.txt, README, company body); `warpjobs.com` kept as the domain. (Whether to keep that domain given the warp.dev collision = a user strategic call; 1-line revert if they prefer "WarpJobs".) | ✅ |
| B-80 | **Privacy precision (#10)**: verified there is ZERO analytics/cookies in the app (only localStorage for ★saved/visited/density). Footer reworded to say exactly that + GitHub-Pages host-logging caveat — GDPR-defensible, no longer an over-absolute claim. | ✅ |
| B-81 | **Dedup (#5)**: VERIFIED already working — raw 10 exact-title dup groups → **0 leaks** after dedup. The "duplicates" seen are genuinely distinct reqs (e.g. "…Performance & Reliability" vs "…**Analysis**", or 4 distinct Anthropic inference roles); merging them would HIDE real jobs. No change — correct as-is. | ✅ verified |
| B-82 | **Level filter (#7)**: `deriveLevel` is title-regex (handles Sr/Senior/Staff/Principal). "Member of Technical Staff" is deliberately left UN-levelled (it spans new-grad→senior at the labs) — forcing a level = guessing (rejected). Honest limitation: the filter matches explicit-level titles, isn't exhaustive (~44% un-levelled). Kept honest, not over-claimed. | ✅ verified |
| B-83 | **Concentration (#4)**: real — top-6 = 67% of 115, 7 singletons. Already exposed by the `/companies-hiring` leaderboard (per-company counts) shipped in D085; the board's true shape is visible, not hidden behind "23 companies". | ✅ addressed |
| B-84 | **SEO indexing (#8)**: JobPosting JSON-LD is on every job page (validThrough+addressCountry fixed in D085). New-domain indexing takes weeks regardless; **submitting the sitemap in Google Search Console is the user's gating step** (needs their Google account) — can't be automated. | ⏳ user-gated |
| B-85 | **Recruiter intake (#9)**: GitHub-issue is fine for the *technical* seeker-side feedback (stale link / add company — that audience uses GitHub, and it's the most anonymity-compatible zero-backend option). The *recruiter* "Post a role" flow genuinely shouldn't need GitHub → proper fix is a free hosted form (Tally/Formspree) = a one-time user setup. Flagged, not fake-fixed. | ⏳ user-gated |

## 4-lens product review — confirmed fixes (2026-06-01, D091)
> 4-persona workflow (PM / software-expert / casual-user / actual-user) × 10 = 40 critiques → partner/expert synthesis verified vs REAL code (killed 6 non-issues w/ evidence, deferred 6, 3 eyeball). 8 fixes shipped (commit f4d7a9a, 31 tests, build green, live-verified on Tenstorrent).

| id | item | status |
|----|------|--------|
| B-89 | **$0K–$0K salary band (high — on a live-ranking page)**: `/company/[slug]` editorial + `StatStrip` printed "$0K–$0K" when salCount>0 but all bands broad (salLo=0). Numeric band now gated on a reliable (non-broad) range; else "(mostly broad legal ranges)". `statsFor` exposes `reliableCount`. Verified gone on `/company/tenstorrent`. | ✅ |
| B-90 | **Company navigational-intent SEO**: GSC shows the real ranking demand is "{company}" queries (tenstorrent 29 / sambanova 18) at 0 clicks. Title → "{Company} Careers — N GPU & ML-systems jobs"; curated factual blurb (`lib/company-meta.js`, ~55 cos) above the list + in `hiringOrganization.description`. Corroborated by all 4 personas. | ✅ |
| B-91 | **Salary-filter silent hide**: a $X+ floor silently dropped ~115 undisclosed-salary roles (incl. OpenAI/Anthropic). Now shows the hidden count + a show/hide toggle (client-side, no backend). | ✅ |
| B-92 | **Tech-stack tags + description search**: allowlist tags (CUDA/Triton/vLLM/Rust/NCCL…) derived from `descriptionHtml` → search haystack + rendered on job pages + `JobPosting.skills`. (Dense list-row rendering deferred = eyeball.) | ✅ |
| B-93 | **regionOf multi-location mis-bucket**: "Amsterdam…; Remote - United States" bucketed US (contradicting the displayed city); now classify on the PRIMARY segment, fall back to full string. +2 tests. | ✅ |
| B-94 | **a11y**: restored search-input focus ring (was `outline:none`) + skip-to-content link + `#main` target on the content container. (Ring contrast = founder eyeball.) | ✅ |
| B-95 | **Post-a-role issue Form**: `.github/ISSUE_TEMPLATE/post-a-role.yml` (Company / ATS dropdown / board token / careers URL) replaces the blank issue; header CTA → `?template=post-a-role.yml`. Zero-backend. | ✅ |
| B-96 | **Over-length titles**: `/salaries` + `/companies-hiring` 83→<60 chars, keyword-first. | ✅ |
| B-97 | **Deferred/rejected (real, later or no-value)**: ItemList JSON-LD = **REJECTED** (schema-theater — no job-collection rich result; consistent w/ D088); OG share image (needs design asset + eyeball); "new since last visit" loop; per-slice RSS; hub-nav promotion; slug-collision CI assert; multi-Place jobLocation; JobPosting enrichment (hiringOrg.url / derived employmentType / noindex-when-empty-desc). Gate: traffic or eyeball. | 🧊 |

## Autonomous cycle — next SEO depth-asset, workflow-vetted (2026-05-31, D088)
> Judge-panel + adversarial-pre-mortem workflow (20 agents) on "what's the single highest-leverage next SEO move". Verdict: **minimal-fix-then-wait** — the asset is at the right MVP+; build exactly two things, then STOP and read GSC. Three other proposed moves were verified **already shipped** (busywork), ItemList = schema-theater, permutation pages = doorway risk the guardrail already blocks.

| id | item | status |
|----|------|--------|
| B-86 | **Region/country coverage fix (Move 1, data-quality)**: `regionOf` + `countryOf` missed Bay-Area cities (Sunnyvale/Santa Clara/San Jose/San Mateo/Milpitas/Bellevue), bare-city forms, Serbia, umlaut Zürich, Korea/Taiwan/Turkey/several EU countries. **`Other` region 23→4** (only genuinely-ambiguous "North America"/Turkey/2 pure-Toronto left); US filter +14 jobs, Europe hub +5; `addressCountry` now emitted on ~15 more leaf JobPostings (Google-for-Jobs eligibility). +2 regression test blocks (29 tests pass). | ✅ |
| B-87 | **`/salaries` comp data-hub (Move 2, depth)**: one substantive page — median base pay by specialty / level / company over the 64 live disclosed non-broad ranges (`getSalaryReport()`, re-derived at build, never hardcoded). Honesty rails: shows `n` per row, suppresses segments <3, excludes ≥2.3× placeholder bands, USD-noted. Differentiated insight incumbents don't segment: frontier labs (~$445K) vs GPU-cloud (~$203K). Indexability + sitemap entry auto-gated on live sample size (same guardrail philosophy). Linked from `/companies-hiring` hubnav + `StatStrip` (every hub). | ✅ |
| B-88 | **Deferred (re-confirmed do-NOT-build now)**: ItemList/CollectionPage JSON-LD (no rich-result for job collections = schema-theater); `/level/manager` (12), standalone `/region/uk` (11), `/gpu-kernel-jobs`, tech-tag/city crosses (doorway risk on zero-authority domain — revisit only if GSC shows the demand). Per the workflow: after these two, STOP building; feature-churn while waiting for the crawl is the named trap. | 🧊 gated on GSC demand |

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
