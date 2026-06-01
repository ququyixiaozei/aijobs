import fs from "node:fs";
import path from "node:path";
import { categories, getCategory } from "../ingest/niche.config.mjs";
import {
  DAY, STALE_DAYS, kebab, postedDateOf, activeDateOf, isRemote, locShort, regionOf,
  parseSalary, hasVisa, isBroadSalary, companyHue, companyColor, timeAgo, exactDate, deriveLevel, deriveTags,
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
        salMax: sal.max,
        salBroad: isBroadSalary(sal.min, sal.max),
        cats: categories.filter((c) => c.match.test(j.title)).map((c) => c.slug),
        tags: deriveTags(j.descriptionHtml),  // allowlist tech-stack tags (search + JobPosting.skills)
        ts: postedDateOf(j),          // real first-published — drives display age + sort
        activeTs: activeDateOf(j),     // most-recent signal — drives freshness/archiving
      };
    })
    .filter((j) => j.activeTs === 0 || now - j.activeTs <= STALE_DAYS * DAY)
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
export function getMeta() {
  const d = load();
  return { generatedAt: d.generatedAt, count: d.jobs.length, companyCount: new Set(d.jobs.map((j) => j.company)).size };
}
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
    salMax: j.salMax,
    salBroad: j.salBroad,
    level: deriveLevel(j.title),
    age: timeAgo(j.ts),
    isToday: j.ts > 0 && Date.now() - j.ts < DAY,
    ts: j.ts,
    cats: j.cats,
    tags: j.tags || [],
    color: companyColor(j.company),
  }));
}

// Programmatic company pages (SEO long-tail + browse-by-employer).
export function getCompaniesLite() {
  const m = new Map();
  for (const j of getAllJobs()) {
    const slug = kebab(j.company);
    if (!m.has(slug)) m.set(slug, { slug, name: j.company, count: 0 });
    m.get(slug).count++;
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
export function getCompanyBySlug(slug) {
  return getCompaniesLite().find((c) => c.slug === slug) || null;
}
export function getJobsByCompany(slug) {
  return getBrowserJobs().filter((j) => kebab(j.company) === slug);
}

// ── Index thresholds: ONE source of truth shared by generateMetadata + sitemap ──
// A cluster of thin, near-duplicate pages on a zero-authority domain can suppress
// sitewide trust (Google's doorway / scaled-content-abuse policies). Below the floor
// we keep the page LIVE and `follow` (users + internal-link equity) but `noindex` it
// and drop it from sitemap.xml — crawlable, just not in the index.
export const MIN_INDEX_COMPANY = 4; // company hubs below this are thin wrappers
export const MIN_INDEX_SLICE = 10; // category / region / level / remote floor
export function isIndexableCompany(count) { return count >= MIN_INDEX_COMPANY; }
export function isIndexableSlice(count) { return count >= MIN_INDEX_SLICE; }
// Next metadata: undefined robots = default (indexable); below floor = noindex,follow.
export function robotsFor(indexable) { return indexable ? undefined : { index: false, follow: true }; }

// Slicers for the hub pages — reuse the already-derived browser shape.
// region accepts a single bucket ("US") or several ("EU"+"UK" = Europe).
export function getJobsByRegion(region) {
  const set = Array.isArray(region) ? region : [region];
  return getBrowserJobs().filter((j) => set.includes(j.region));
}
export function getRemoteJobs() { return getBrowserJobs().filter((j) => j.remote); }
export function getJobsByLevel(level) { return getBrowserJobs().filter((j) => j.level === level); }

// Aggregate facts over a set of browser-shaped jobs — powers the dataset-stat strips.
// Pure derivation over the existing corpus: no fabricated content, no new sources.
export function statsFor(jobs) {
  // disclosed = posted any range; reliable = a usable (non-placeholder-wide) band.
  // The observed band is computed only from reliable ranges so broad legal bands
  // (e.g. $100K–$500K) don't blow it out.
  const disclosed = jobs.filter((j) => j.sal || j.salText);
  const reliable = jobs.filter((j) => j.salMin && !j.salBroad);
  const salLo = reliable.length ? Math.min(...reliable.map((j) => j.salMin)) : 0;
  const salHi = reliable.length ? Math.max(...reliable.map((j) => j.salMax || j.salMin)) : 0;
  const byCompany = new Map();
  for (const j of jobs) byCompany.set(j.company, (byCompany.get(j.company) || 0) + 1);
  const topCompanies = [...byCompany.entries()]
    .map(([name, n]) => ({ name, n, slug: kebab(name) }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const level = { senior: 0, staff: 0, manager: 0, junior: 0 };
  for (const j of jobs) if (level[j.level] !== undefined) level[j.level]++;
  const byCat = categories
    .map((c) => ({ slug: c.slug, name: c.name, n: jobs.filter((j) => (j.cats || []).includes(c.slug)).length }))
    .filter((x) => x.n);
  return {
    total: jobs.length,
    companies: byCompany.size,
    salCount: disclosed.length,
    reliableCount: reliable.length,   // disclosed AND non-broad → a usable numeric band exists
    salLo,
    salHi,
    remote: jobs.filter((j) => j.remote).length,
    visa: jobs.filter((j) => j.visa).length,
    topCompanies,
    level,
    byCat,
  };
}

// Cross-company compensation aggregation that powers /salaries. Pure derivation over
// the SAME reliable (non-placeholder) bands JobPosting.baseSalary uses — no new data,
// no fabricated figures. Reports MEDIANS (robust to a single high-paying employer like
// Anthropic) of the floor / midpoint / ceiling. Segments below MIN_SALARY_N are dropped
// as too thin to state honestly. USD: virtually all disclosure in this corpus is US.
export const MIN_SALARY_N = 3;
export function getSalaryReport() {
  const all = getBrowserJobs();
  const reliable = all.filter((j) => j.salMin && !j.salBroad);
  const mid = (j) => (j.salMin + (j.salMax || j.salMin)) / 2;
  const median = (xs) => {
    if (!xs.length) return 0;
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const band = (g) => ({
    n: g.length,
    lo: median(g.map((j) => j.salMin)),                 // real disclosed floor (median of mins)
    mid: Math.round(median(g.map(mid))),                // midpoint estimate → round to whole $K
    hi: median(g.map((j) => j.salMax || j.salMin)),     // real disclosed ceiling (median of maxes)
  });
  const seg = (groups) => groups.filter((x) => x.n >= MIN_SALARY_N).sort((a, b) => b.mid - a.mid);

  const bySpecialty = seg(categories.map((c) => ({
    slug: c.slug,
    label: c.name.replace(/ Jobs$/, ""),
    ...band(reliable.filter((j) => (j.cats || []).includes(c.slug))),
  })));
  const byLevel = seg(
    [["senior", "Senior"], ["staff", "Staff / Principal"], ["manager", "Manager / Director"]]
      .map(([key, label]) => ({ key, label, ...band(reliable.filter((j) => j.level === key)) }))
  );
  const byCompanyMap = new Map();
  for (const j of reliable) {
    if (!byCompanyMap.has(j.company)) byCompanyMap.set(j.company, []);
    byCompanyMap.get(j.company).push(j);
  }
  const byCompany = seg([...byCompanyMap.entries()].map(([name, g]) => ({ name, slug: kebab(name), ...band(g) })));

  return {
    overall: band(reliable),
    disclosed: all.filter((j) => j.sal || j.salText).length,
    total: all.length,
    bySpecialty,
    byLevel,
    byCompany,
    minN: MIN_SALARY_N,
  };
}
