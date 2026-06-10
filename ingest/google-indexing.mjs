// ── GOOGLE INDEXING API PUSH ──────────────────────────────────────
// Google's Indexing API is officially scoped to JobPosting (and broadcast-event)
// pages — exactly what our /jobs/ leaves are. It is the one sanctioned way to get
// job pages crawled within minutes instead of waiting weeks for organic crawl on
// a low-authority domain, which is the precondition for Google-for-Jobs surfacing.
//
// Auth: a GCP service account whose email is a delegated OWNER of the GSC
// property. The full service-account JSON is injected as the CI secret
// GOOGLE_INDEXING_SA_KEY — absent locally and on forks, in which case this is a
// silent no-op (same contract as indexnow.mjs: never fail the deploy).
//
// Quota: default 200 publish requests/day. We cap at 190 and prioritize
// never-pushed job URLs, then deletions for vanished ones; leftovers roll to the
// next daily run. State lives in data/gindex-state.json (committed by CI).
//
// Zero-dep: the OAuth2 JWT assertion is signed with node:crypto (RS256).

import { readFileSync, writeFileSync } from "node:fs";
import crypto from "node:crypto";

const SITE = (process.env.SITE_URL || "https://warpjobs.com").replace(/\/$/, "");
const STATE_PATH = new URL("../data/gindex-state.json", import.meta.url);
const DAILY_CAP = 190;

function jobUrlsFromSitemap() {
  let xml = "";
  try { xml = readFileSync(new URL("../out/sitemap.xml", import.meta.url), "utf8"); }
  catch { console.log("gindex: out/sitemap.xml not found — skipping"); return []; }
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.includes("/jobs/"));
}

function loadState() {
  try { return JSON.parse(readFileSync(STATE_PATH, "utf8")); }
  catch { return { pushed: {} }; }
}

async function getAccessToken(sa) {
  const b64url = (s) => Buffer.from(s).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const jwt = `${header}.${claims}.${signer.sign(sa.private_key).toString("base64url")}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`token HTTP ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function publish(token, url, type) {
  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url, type }),
  });
  return res.status;
}

async function main() {
  const raw = process.env.GOOGLE_INDEXING_SA_KEY;
  if (!raw) { console.log("gindex: GOOGLE_INDEXING_SA_KEY not set — skipping (no-op)"); return; }
  const live = jobUrlsFromSitemap();
  if (!live.length) return;

  const state = loadState();
  const liveSet = new Set(live);
  const toAdd = live.filter((u) => !state.pushed[u]);
  const toDelete = Object.keys(state.pushed).filter((u) => !liveSet.has(u));

  if (!toAdd.length && !toDelete.length) { console.log("gindex: nothing new to push"); return; }

  const token = await getAccessToken(JSON.parse(raw));
  let budget = DAILY_CAP, ok = 0, quotaHit = false;

  for (const [list, type, onOk] of [
    [toAdd, "URL_UPDATED", (u) => { state.pushed[u] = new Date().toISOString(); }],
    [toDelete, "URL_DELETED", (u) => { delete state.pushed[u]; }],
  ]) {
    for (const u of list) {
      if (budget <= 0 || quotaHit) break;
      const status = await publish(token, u, type);
      budget--;
      if (status === 200) { ok++; onOk(u); }
      else if (status === 429) { quotaHit = true; console.log("gindex: quota exhausted — rest rolls to next run"); }
      else console.log(`gindex: ${type} ${u} -> HTTP ${status}`);
    }
  }

  writeFileSync(STATE_PATH, JSON.stringify(state, null, 0) + "\n");
  console.log(`gindex: pushed ${ok} notifications (${toAdd.length} new / ${toDelete.length} gone queued; cap ${DAILY_CAP})`);
}

// Never fail the deploy over an indexing push.
main().catch((e) => console.log(`gindex: ${e.message}`));
