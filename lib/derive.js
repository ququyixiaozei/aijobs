// Pure, IO-free derivation helpers — unit-tested in test/derive.test.mjs.
// Keep this file side-effect free (no fs, no env) so it stays trivially testable.

export const DAY = 86400000;
export const STALE_DAYS = 90;

export function kebab(s = "") {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function dateOf(j) {
  const d = new Date(j.updatedAt || j.postedAt || 0).getTime();
  return isNaN(d) ? 0 : d;
}

// Display age + sort use the REAL first-published date. `updatedAt` is the ATS
// last-modified, which several companies bulk-touch (e.g. Nebius: 11 distinct
// postedAt days but one updatedAt day) — using it makes everything falsely "today".
export function postedDateOf(j) {
  const d = new Date(j.postedAt || j.updatedAt || 0).getTime();
  return isNaN(d) ? 0 : d;
}
// Freshness/archiving uses the most-recent signal so a still-active old posting
// isn't dropped just because it was first published long ago.
export function activeDateOf(j) {
  const p = new Date(j.postedAt || 0).getTime();
  const u = new Date(j.updatedAt || 0).getTime();
  return Math.max(isNaN(p) ? 0 : p, isNaN(u) ? 0 : u);
}

// A posted range whose top is >= 2.3x its floor is a legal/placeholder band, not a
// real comp signal (e.g. Tenstorrent "$100K–$500K" = 5x). Flag it so the UI can mark
// it and exclude it from salary sort/filter instead of letting it masquerade as precise.
export const SAL_BROAD_RATIO = 2.3;
export function isBroadSalary(min, max) {
  return min > 0 && max > 0 && max / min >= SAL_BROAD_RATIO;
}

export function isRemote(loc = "") {
  return /\bremote\b|\banywhere\b|work from home|\bwfh\b/i.test(String(loc));
}

export function locShort(loc = "") {
  if (!loc) return "";
  let s = String(loc).split(/[;\/|]/)[0].split(" - ")[0].split(",")[0].trim();
  if (/^remote$/i.test(s)) return "Remote";
  return s.length > 22 ? s.slice(0, 21) + "…" : s;
}

export function regionOf(loc = "", remote = false) {
  const s = String(loc).toLowerCase();
  if (/united states|u\.s\.|\busa\b|, ca|, ny|, wa|, tx|california|new york|seattle|san francisco|bay area|mountain view|palo alto|austin|boston|denver|chicago|washington/.test(s)) return "US";
  if (/united kingdom|\buk\b|london|england|bristol|cambridge|oxford|manchester|edinburgh/.test(s)) return "UK";
  if (/germany|france|netherlands|amsterdam|paris|berlin|munich|zurich|switzerland|spain|sweden|poland|ireland|dublin|\beu\b|europe/.test(s)) return "EU";
  if (/japan|tokyo|singapore|india|bangalore|bengaluru|china|korea|seoul|taiwan|taipei|sydney|australia|hong kong|apac|asia/.test(s)) return "APAC";
  if (remote) return "Remote";
  return "Other";
}

// Best-effort ISO-3166 country for JobPosting.addressCountry (Google for Jobs likes
// it). Returns "" when not confidently derivable rather than guessing.
const COUNTRY = [
  [/united states|u\.s\.|\busa\b|, ca\b|, ny\b|, wa\b|, tx\b|, ma\b|california|new york|seattle|san francisco|bay area|mountain view|palo alto|sunnyvale|austin|boston|denver|chicago|washington/, "US"],
  [/united kingdom|\buk\b|london|england|bristol|cambridge|oxford|manchester|edinburgh/, "GB"],
  [/paris|\bfrance\b/, "FR"],
  [/amsterdam|netherlands/, "NL"],
  [/berlin|munich|münchen|germany|deutschland/, "DE"],
  [/zurich|zürich|switzerland/, "CH"],
  [/dublin|ireland/, "IE"],
  [/madrid|barcelona|spain/, "ES"],
  [/stockholm|sweden/, "SE"],
  [/warsaw|poland/, "PL"],
  [/tokyo|japan/, "JP"],
  [/singapore/, "SG"],
  [/bangalore|bengaluru|\bindia\b/, "IN"],
  [/toronto|vancouver|montreal|canada/, "CA"],
  [/sydney|melbourne|australia/, "AU"],
];
export function countryOf(loc = "") {
  const s = String(loc).toLowerCase();
  for (const [re, code] of COUNTRY) if (re.test(s)) return code;
  return "";
}

const RANGE_K = /\$\s?(\d{2,3})\s?[kK]\b\s*(?:[-–—]|to)\s*\$?\s?(\d{2,3})\s?[kK]\b/;
const RANGE_FULL = /\$\s?(\d{3}),(\d{3})\s*(?:[-–—]|to)\s*\$?\s?(\d{3}),(\d{3})/;
export function parseSalary(html = "") {
  const t = String(html).replace(/<[^>]+>/g, " ");
  let m = t.match(RANGE_K);
  if (m) return { text: `$${m[1]}K–$${m[2]}K`, min: +m[1], max: +m[2] };
  m = t.match(RANGE_FULL);
  if (m) return { text: `$${m[1]}K–$${m[3]}K`, min: +m[1], max: +m[3] };
  return { text: "", min: 0, max: 0 };
}

export function hasVisa(html = "") {
  return /visa|sponsor|relocation|work permit|right to work/i.test(String(html).replace(/<[^>]+>/g, " "));
}

export function companyHue(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 53 + name.charCodeAt(i) * 13) % 360;
  return h;
}
export function companyColor(name = "") {
  return `hsl(${companyHue(name)} 46% 40%)`;
}

// Coarse seniority from the title. "Member of Technical Staff" is stripped first
// so its "staff" doesn't masquerade as a staff-level signal (it spans levels).
export function deriveLevel(title = "") {
  const t = String(title).toLowerCase().replace(/members? of technical staff|technical staff/g, "");
  if (/\b(manager|director|head of|vp|vice president)\b/.test(t)) return "manager";
  if (/\b(staff|principal|distinguished|architect)\b|\blead\b/.test(t)) return "staff";
  if (/\bsenior\b|\bsr\.?\b/.test(t)) return "senior";
  if (/\b(intern|new grad|graduate|junior|entry)\b/.test(t)) return "junior";
  return "";
}

export function timeAgo(iso, now = Date.now()) {
  const t = typeof iso === "number" ? iso : new Date(iso || 0).getTime();
  if (!t || isNaN(t)) return "";
  const days = Math.floor((now - t) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

export function exactDate(iso) {
  const d = new Date(iso || 0);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
