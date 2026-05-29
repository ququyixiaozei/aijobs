import { getBrowserJobs } from "../../lib/jobs.js";

export const dynamic = "force-static";

const SITE = process.env.SITE_URL || "https://example.com";
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = getBrowserJobs()
    .slice(0, 80)
    .map((j) => {
      const loc = j.locations[0] || (j.remote ? "Remote" : "");
      const desc = [j.company, loc, j.sal].filter(Boolean).join(" · ");
      const link = `${SITE}/jobs/${j.slug}/`;
      return `<item><title>${esc(j.title + " — " + j.company)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><description>${esc(desc)}</description></item>`;
    })
    .join("");
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0"><channel>` +
    `<title>AI Infra Jobs — GPU/CUDA/ML-systems</title>` +
    `<link>${SITE}/</link>` +
    `<description>Latest GPU, CUDA, ML-systems, inference &amp; performance engineering roles at AI labs and infra startups.</description>` +
    items +
    `</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
