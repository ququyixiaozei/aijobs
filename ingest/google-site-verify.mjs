// ── SITE VERIFICATION (service-account self-verify) ───────────────
// The Search Console UI rejects service-account emails ("email not found")
// and the legacy verification page now redirects — so the SA can't be added
// as a delegated owner by hand. This script makes the SA verify ITSELF as an
// owner of the URL-prefix site via the Site Verification API:
//
//   mode `token`  (build job, pre-build): fetch the SA's deterministic FILE
//     verification token and write public/<token> so the build serves it.
//   mode `insert` (deploy job, post-deploy): once the file is live, call
//     webResource.insert → the SA becomes a verified owner → Indexing API
//     authorized. Idempotent; safe to run every deploy; never fails the run.
//
// Auth: GOOGLE_INDEXING_ACCESS_TOKEN minted by WIF in CI with the
// siteverification scope. Requires Site Verification API enabled on the
// GCP project (gcloud services enable siteverification.googleapis.com).

import { writeFileSync } from "node:fs";

const SITE = (process.env.SITE_URL || "https://warpjobs.com").replace(/\/$/, "") + "/";
const TOKEN = process.env.GOOGLE_INDEXING_ACCESS_TOKEN;
const MODE = process.argv[2] || "token";

async function api(path, body) {
  const res = await fetch(`https://www.googleapis.com/siteVerification/v1/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

const SITE_BODY = { site: { identifier: SITE, type: "SITE" } };

async function main() {
  if (!TOKEN) { console.log("siteverify: no access token — skipping (no-op)"); return; }

  if (MODE === "token") {
    const r = await api("token", { verificationMethod: "FILE", ...SITE_BODY });
    if (r.status !== 200) { console.log(`siteverify: getToken HTTP ${r.status}: ${r.body}`); return; }
    const fileName = JSON.parse(r.body).token; // e.g. google123abc.html — stable per (SA, site)
    writeFileSync(new URL(`../public/${fileName}`, import.meta.url), `google-site-verification: ${fileName}`);
    console.log(`siteverify: wrote public/${fileName}`);
    return;
  }

  if (MODE === "insert") {
    // The token file must be LIVE; Pages/CDN can lag a moment after deploy.
    for (let attempt = 1; attempt <= 4; attempt++) {
      const r = await api("webResource?verificationMethod=FILE", SITE_BODY);
      if (r.status === 200) { console.log("siteverify: SA is now a verified owner ✓"); return; }
      console.log(`siteverify: insert attempt ${attempt} HTTP ${r.status}: ${r.body.slice(0, 300)}`);
      if (attempt < 4) await new Promise((s) => setTimeout(s, 30000));
    }
    console.log("siteverify: not verified yet — will retry on next deploy (non-fatal)");
  }
}

// Never fail CI over verification plumbing.
main().catch((e) => console.log(`siteverify: ${e.message}`));
