import fs from "node:fs";
import path from "node:path";
import { categories, getCategory } from "../ingest/niche.config.mjs";
import {
  DAY, STALE_DAYS, kebab, dateOf, isRemote, locShort, regionOf,
  parseSalary, hasVisa, companyHue, companyColor, timeAgo, exactDate,
} from "./derive.js";

// Path prefix for internal links (matches next.config basePath). '' at root / on a custom domain.
export const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

// re-export pure helpers so consumers keep importing from one place
export { companyHue, companyColor, timeAgo, exactDate };

let cache = null;
function load() {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "jobs.json");
  let raw = { jobs: [], generatedAt: null };
  try { raw = JSON.parse(fs.readFileSync(file, "utf8")); } catch { /* not ingested yet */ }
  const now = Date.now();

  const mapped = (raw.jobs || [])
    .map((j) => {
      const sal = parseSalary(j.descriptionHtml);
      return {
        ...j,
        slug: `${kebab(j.company)}-${kebab(j.title)}-${String(j.sourceId).slice(-6)}`,
        remote: isRemote(j.location),
        locShort: locShort(j.location),
        region: regionOf(j.location, isRemote(j.location)),
        visa: hasVisa(j.descriptionHtml),
        salText: sal.text,
        salMin: sal.min,
        cats: categories.filter((c) => c.match.test(j.title)).map((c) => c.slug),
        ts: dateOf(j),
      };
    })
    .filter((j) => j.ts === 0 || now - j.ts <= STALE_DAYS * DAY)
    .sort((a, b) => b.ts - a.ts);

  // dedup same company + same (normalized) title → one row, collect locations
  const byKey = new Map();
  for (const j of mapped) {
    const key = j.company + "|" + kebab(j.title);
    if (byKey.has(key)) {
      const e = byKey.get(key);
      if (j.locShort && !e.locations.includes(j.locShort)) e.locations.push(j.locShort);
      if (j.remote) e.remote = true;
    } else {
      byKey.set(key, { ...j, locations: j.locShort ? [j.locShort] : [] });
    }
  }
  cache = { generatedAt: raw.generatedAt || null, jobs: [...byKey.values()] };
  return cache;
}

export function getAllJobs() { return load().jobs; }
export function getMeta() { const d = load(); return { generatedAt: d.generatedAt, count: d.jobs.length }; }
export function getJobBySlug(slug) { return load().jobs.find((j) => j.slug === slug) || null; }
export function getJobsByCategory(slug) {
  if (!getCategory(slug)) return null;
  return getAllJobs().filter((j) => j.cats.includes(slug));
}
export function getCategoriesLite() {
  const all = getAllJobs();
  return categories.map((c) => ({ slug: c.slug, name: c.name, count: all.filter((j) => j.cats.includes(c.slug)).length }));
}
export function getBrowserJobs() {
  return getAllJobs().map((j) => ({
    slug: j.slug,
    title: j.title,
    company: j.company,
    locations: j.locations.length ? j.locations : (j.remote ? ["Remote"] : []),
    region: j.region,
    remote: j.remote,
    visa: j.visa,
    sal: j.salText,
    salMin: j.salMin,
    age: timeAgo(j.ts),
    isToday: j.ts > 0 && Date.now() - j.ts < DAY,
    ts: j.ts,
    cats: j.cats,
    color: companyColor(j.company),
  }));
}
