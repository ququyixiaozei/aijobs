import { getBrowserJobs, getMeta } from "../../lib/jobs.js";

export const dynamic = "force-static";

const SITE = process.env.SITE_URL || "https://example.com";

export function GET() {
  const meta = getMeta();
  const jobs = getBrowserJobs().map((j) => ({
    title: j.title,
    company: j.company,
    locations: j.locations,
    region: j.region,
    remote: j.remote,
    visa_sponsor: j.visa,
    salary: j.sal || null,
    posted: j.age,
    categories: j.cats,
    url: `${SITE}/jobs/${j.slug}/`,
  }));
  return new Response(JSON.stringify({ generatedAt: meta.generatedAt, count: jobs.length, jobs }, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
