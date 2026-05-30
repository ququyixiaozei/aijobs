// ── INGEST ORCHESTRATOR ───────────────────────────────────────────
// node ingest/run.mjs  →  fetches all companies, filters to the niche,
// dedupes, and writes data/jobs.json (the static source the Next.js site reads).
// Designed to run on a daily Vercel Cron / GitHub Action later.

import { writeFile, mkdir } from "node:fs/promises";
import { fetchers } from "./sources.mjs";
import { companies } from "./companies.mjs";
import { matchesNiche, niche } from "./niche.config.mjs";
import { sanitizeJobHtml } from "./sanitize.mjs";

async function run() {
  const all = [];
  const report = [];

  for (const c of companies) {
    const fn = fetchers[c.ats];
    if (!fn) { report.push(`SKIP ${c.name}: unknown ats '${c.ats}'`); continue; }
    try {
      const raw = await fn(c.token);
      const matched = raw
        .filter((j) => matchesNiche(j.title))
        .map((j) => ({
          ...j,
          company: c.name,
          companyToken: c.token,
          source: c.ats,
          descriptionHtml: sanitizeJobHtml(j.descriptionHtml), // untrusted ATS HTML → allowlist
          url: /^https?:\/\//i.test(j.url || "") ? j.url : "", // defense-in-depth: only http(s) apply links
        }));
      all.push(...matched);
      report.push(`OK   ${c.name} [${c.ats}/${c.token}]: ${raw.length} jobs → ${matched.length} ${niche.slug}`);
    } catch (e) {
      report.push(`FAIL ${c.name} [${c.ats}/${c.token}]: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 250)); // be polite to the ATS APIs
  }

  // dedupe by sourceId, newest first
  const seen = new Set();
  const jobs = all
    .filter((j) => (seen.has(j.sourceId) ? false : seen.add(j.sourceId)))
    .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));

  const out = { niche: niche.slug, name: niche.name, generatedAt: new Date().toISOString(), count: jobs.length, jobs };
  await mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await writeFile(new URL("../data/jobs.json", import.meta.url), JSON.stringify(out, null, 2));

  console.log(report.join("\n"));
  console.log(`\n── TOTAL ${niche.slug}: ${jobs.length} jobs from ${companies.length} companies → data/jobs.json`);
}

run().catch((e) => { console.error(e); process.exit(1); });
