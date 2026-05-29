import fs from "node:fs";
import path from "node:path";
import { categories, getCategory } from "../ingest/niche.config.mjs";

// Path prefix for internal links (matches next.config basePath). '' at root / on a custom domain.
export const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

const DAY = 86400000;
const STALE_DAYS = 90; // archive postings older than this (signal > noise on a "daily" board)

function kebab(s = "") {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
function dateOf(j) {
  const d = new Date(j.updatedAt || j.postedAt || 0).getTime();
  return isNaN(d) ? 0 : d;
}
function isRemote(loc = "") {
  return /\bremote\b|\banywhere\b|work from home|\bwfh\b/i.test(String(loc));
}
function locShort(loc = "") {
  if (!loc) return "";
  let s = String(loc).split(/[;\/|]/)[0].split(" - ")[0].split(",")[0].trim();
  if (/^remote$/i.test(s)) return "Remote";
  return s.length > 24 ? s.slice(0, 23) + "…" : s;
}
const RANGE_K = /\$\s?(\d{2,3})\s?[kK]\b\s*(?:[-–—]|to)\s*\$?\s?(\d{2,3})\s?[kK]\b/;
const RANGE_FULL = /\$\s?(\d{3}),(\d{3})\s*(?:[-–—]|to)\s*\$?\s?(\d{3}),(\d{3})/;
function extractSalary(html = "") {
  const t = String(html).replace(/<[^>]+>/g, " ");
  let m = t.match(RANGE_K);
  if (m) return `$${m[1]}K–$${m[2]}K`;
  m = t.match(RANGE_FULL);
  if (m) return `$${m[1]}K–$${m[3]}K`;
  return "";
}
export function companyHue(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

let cache = null;
function load() {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "jobs.json");
  let raw = { jobs: [], generatedAt: null };
  try { raw = JSON.parse(fs.readFileSync(file, "utf8")); } catch { /* not ingested yet */ }
  const now = Date.now();
  const jobs = (raw.jobs || [])
    .map((j) => ({
      ...j,
      slug: `${kebab(j.company)}-${kebab(j.title)}-${String(j.sourceId).slice(-6)}`,
      remote: isRemote(j.location),
      locShort: locShort(j.location),
      salary: extractSalary(j.descriptionHtml),
      cats: categories.filter((c) => c.match.test(j.title)).map((c) => c.slug), // title-based = differentiated facets
      ts: dateOf(j),
    }))
    .filter((j) => j.ts === 0 || now - j.ts <= STALE_DAYS * DAY)
    .sort((a, b) => b.ts - a.ts);
  cache = { generatedAt: raw.generatedAt || null, jobs };
  return cache;
}

export function getAllJobs() { return load().jobs; }
export function getMeta() { const d = load(); return { generatedAt: d.generatedAt, count: d.jobs.length }; }
export function getJobBySlug(slug) { return load().jobs.find((j) => j.slug === slug) || null; }
export function getJobsByCategory(slug) {
  if (!getCategory(slug)) return null;
  return getAllJobs().filter((j) => j.cats.includes(slug));
}

// Serializable category list with live counts (safe to pass to client components — no RegExp).
export function getCategoriesLite() {
  const all = getAllJobs();
  return categories.map((c) => ({ slug: c.slug, name: c.name, count: all.filter((j) => j.cats.includes(c.slug)).length }));
}

// Slim, JSON-serializable projection for the client-side browser (no heavy descriptionHtml).
export function getBrowserJobs() {
  return getAllJobs().map((j) => ({
    slug: j.slug,
    title: j.title,
    company: j.company,
    locShort: j.locShort,
    remote: j.remote,
    salary: j.salary,
    age: timeAgo(j.ts),
    ts: j.ts,
    cats: j.cats,
    hue: companyHue(j.company),
  }));
}

export function timeAgo(iso) {
  const t = typeof iso === "number" ? iso : new Date(iso || 0).getTime();
  if (!t || isNaN(t)) return "";
  const days = Math.floor((Date.now() - t) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}
export function exactDate(iso) {
  const d = new Date(iso || 0);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
