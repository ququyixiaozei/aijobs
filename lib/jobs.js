import fs from "node:fs";
import path from "node:path";
import { categories, getCategory } from "../ingest/niche.config.mjs";

// Path prefix for internal links (matches next.config basePath). '' at root / on a custom domain.
export const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

function kebab(s = "") {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

let cache = null;
function load() {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "jobs.json");
  let raw = { jobs: [], generatedAt: null };
  try { raw = JSON.parse(fs.readFileSync(file, "utf8")); } catch { /* not ingested yet */ }
  const jobs = (raw.jobs || []).map((j) => ({
    ...j,
    slug: `${kebab(j.company)}-${kebab(j.title)}-${String(j.sourceId).slice(-6)}`,
  }));
  cache = { generatedAt: raw.generatedAt || null, jobs };
  return cache;
}

export function getAllJobs() { return load().jobs; }
export function getMeta() { const d = load(); return { generatedAt: d.generatedAt, count: d.jobs.length }; }
export function getJobBySlug(slug) { return load().jobs.find((j) => j.slug === slug) || null; }

export function getCategories() { return categories; }
export function getJobsByCategory(slug) {
  const c = getCategory(slug);
  if (!c) return null;
  return getAllJobs().filter((j) => c.match.test(j.title));
}

export function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const mo = Math.floor(days / 30);
  return mo === 1 ? "1mo ago" : `${mo}mo ago`;
}
