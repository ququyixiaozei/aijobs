import { getAllJobs, getCategories } from "../lib/jobs.js";

export const dynamic = "force-static";

const SITE = process.env.SITE_URL || "https://example.com";

export default function sitemap() {
  const jobs = getAllJobs();
  const cats = getCategories();
  return [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    ...cats.map((c) => ({ url: `${SITE}/${c.slug}`, changeFrequency: "daily", priority: 0.8 })),
    ...jobs.map((j) => ({
      url: `${SITE}/jobs/${j.slug}`,
      lastModified: j.updatedAt || j.postedAt || undefined,
      changeFrequency: "daily",
      priority: 0.7,
    })),
  ];
}
