// ── INDEXNOW PING ─────────────────────────────────────────────────
// After each deploy, tell IndexNow-participating engines (Bing, Yandex,
// Seznam, etc.) which URLs changed so they (re)crawl fast — no waiting for
// an organic crawl, no human action. Google does NOT use IndexNow (its path
// is the sitemap + Search Console), so this is a partial, Bing/Yandex-side win.
//
// Key verification: engines fetch https://<host>/<key>.txt and check it equals
// <key>. We host that file via public/<key>.txt (copied to out/ at build).
// Reads the freshly-built out/sitemap.xml as the single source of truth for URLs.

import { readFileSync } from "node:fs";

const KEY = "6b1e4a2f9c7d40e8b3a1f5d6c8e09a2b";
const SITE = (process.env.SITE_URL || "https://warpjobs.com").replace(/\/$/, "");
const host = new URL(SITE).host;

function urlsFromSitemap() {
  let xml = "";
  try { xml = readFileSync(new URL("../out/sitemap.xml", import.meta.url), "utf8"); }
  catch { console.log("indexnow: out/sitemap.xml not found — skipping"); return []; }
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter(Boolean);
}

async function main() {
  const urlList = urlsFromSitemap();
  if (!urlList.length) return;
  const body = { host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList };
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    // IndexNow returns 200 (accepted) or 202 (accepted, key validation pending).
    console.log(`indexnow: submitted ${urlList.length} urls -> HTTP ${res.status}`);
  } catch (e) {
    console.log(`indexnow: ping failed (non-fatal): ${e.message}`);
  }
}

// Never fail the deploy over an indexing ping.
main().catch((e) => console.log(`indexnow: ${e.message}`));
