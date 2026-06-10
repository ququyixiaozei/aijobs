import {
  getAllJobs, getCategoriesLite, getCompaniesLite,
  getJobsByRegion, getJobsByLevel, getRemoteJobs, getSalaryReport,
  isIndexableCompany, isIndexableSlice,
} from "../lib/jobs.js";

export const dynamic = "force-static";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

// Only INDEXABLE URLs belong in the sitemap — it must agree with the per-page
// robots directives (same isIndexable* helpers in lib/jobs.js = one source of
// truth). Thin company/category/hub pages stay live + crawlable+follow for users
// and internal-link equity, but are kept out of the index and out of here.
export default function sitemap() {
  const jobs = getAllJobs();
  const cats = getCategoriesLite().filter((c) => isIndexableSlice(c.count));
  const cos = getCompaniesLite().filter((c) => isIndexableCompany(c.count));

  const hubs = [
    { url: `${SITE}/companies-hiring/`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/post-a-job/`, changeFrequency: "monthly", priority: 0.5 },
  ];
  if (isIndexableSlice(getSalaryReport().overall.n)) hubs.push({ url: `${SITE}/salaries/`, changeFrequency: "weekly", priority: 0.7 });
  if (isIndexableSlice(getRemoteJobs().length)) hubs.push({ url: `${SITE}/remote/`, changeFrequency: "daily", priority: 0.7 });
  if (isIndexableSlice(getJobsByRegion(["EU", "UK"]).length)) hubs.push({ url: `${SITE}/region/europe/`, changeFrequency: "daily", priority: 0.7 });
  for (const lvl of ["senior", "staff"]) {
    if (isIndexableSlice(getJobsByLevel(lvl).length)) hubs.push({ url: `${SITE}/level/${lvl}/`, changeFrequency: "daily", priority: 0.7 });
  }

  return [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/companies/`, changeFrequency: "daily", priority: 0.6 },
    ...hubs,
    ...cats.map((c) => ({ url: `${SITE}/${c.slug}/`, changeFrequency: "daily", priority: 0.8 })),
    ...cos.map((c) => ({ url: `${SITE}/company/${c.slug}/`, changeFrequency: "daily", priority: 0.6 })),
    ...jobs.map((j) => ({
      url: `${SITE}/jobs/${j.slug}/`,
      lastModified: j.updatedAt || j.postedAt || undefined,
      changeFrequency: "daily",
      priority: 0.7,
    })),
  ];
}
