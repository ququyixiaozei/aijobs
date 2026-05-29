import fs from "node:fs";
import path from "node:path";
import { categories, getCategory } from "../ingest/niche.config.mjs";

export const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

const DAY = 86400000;
const STALE_DAYS = 90; // archive postings older than this

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
  return s.length > 22 ? s.slice(0, 21) + "…" : s;
}
function regionOf(loc = "", remote = false) {
  const s = String(loc).toLowerCase();
  if (/united states|u\.s\.|\busa\b|, ca|, ny|, wa|, tx|california|new york|seattle|san francisco|bay area|mountain view|palo alto|austin|boston|denver|chicago|washington/.test(s)) return "US";
  if (/united kingdom|\buk\b|london|england|bristol|cambridge|oxford|manchester|edinburgh/.test(s)) return "UK";
  if (/germany|france|netherlands|amsterdam|paris|berlin|munich|zurich|switzerland|spain|sweden|poland|ireland|dublin|\beu\b|europe/.test(s)) return "EU";
  if (/japan|tokyo|singapore|india|bangalore|bengaluru|china|korea|seoul|taiwan|taipei|sydney|australia|hong kong|apac|asia/.test(s)) return "APAC";
  if (remote) return "Remote";
  return "Other";
}
const RANGE_K = /\$\s?(\d{2,3})\s?[kK]\b\s*(?:[-–—]|to)\s*\$?\s?(\d{2,3})\s?[kK]\b/;
const RANGE_FULL = /\$\s?(\d{3}),(\d{3})\s*(?:[-–—]|to)\s*\$?\s?(\d{3}),(\d{3})/;
function parseSalary(html = "") {
  const t = String(html).replace(/<[^>]+>/g, " ");
  let m = t.match(RANGE_K);
  if (m) return { text: `$${m[1]}K–$${m[2]}K`, min: +m[1], max: +m[2] };
  m = t.match(RANGE_FULL);
  if (m) return { text: `$${m[1]}K–$${m[3]}K`, min: +m[1], max: +m[3] };
  return { text: "", min: 0, max: 0 };
}
function hasVisa(html = "") {
  return /visa|sponsor|relocation|work permit|right to work/i.test(String(html).replace(/<[^>]+>/g, " "));
}
export function companyHue(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 53 + name.charCodeAt(i) * 13) % 360;
  return h;
}
export function companyColor(name = "") {
  return `hsl(${companyHue(name)} 46% 40%)`; // even hue ring, fixed S/L → reproducible + distinguishable
}

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

  // dedup same company + same title (multi-location postings) → one row, collect locations
  const byKey = new Map();
  for (const j of mapped) {
    const key = j.company + "|" + kebab(j.title); // normalize punctuation/whitespace so dash-variants fold
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
