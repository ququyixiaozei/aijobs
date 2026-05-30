import JobBrowser from "../JobBrowser.js";
import { getBrowserJobs, getCategoriesLite, getMeta, BP } from "../../lib/jobs.js";
import { getCategory } from "../../ingest/niche.config.mjs";
import { ld } from "../../lib/jsonld.js";
import { notFound } from "next/navigation";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return getCategoriesLite().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return { title: "Not found" };
  return {
    title: `${c.name} — WarpJobs`,
    description: c.blurb || `Open ${c.name.toLowerCase()} at AI labs and infrastructure startups. Refreshed daily.`,
    alternates: { canonical: `/${category}/` },
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) notFound();
  const jobs = getBrowserJobs();
  const cats = getCategoriesLite();
  const meta = getMeta();
  const count = (cats.find((x) => x.slug === category) || {}).count || 0;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "All roles", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: c.name, item: `${SITE}/${category}/` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd) }} />
      <section className="hero">
        <p><a href={`${BP}/`} className="back">← all roles</a></p>
        <h1>{c.name}</h1>
        {c.blurb ? <p>{c.blurb} <strong>{count}</strong> open now, refreshed daily.</p> : null}
      </section>
      <JobBrowser jobs={jobs} cats={cats} initialCat={category} generatedAt={meta.generatedAt} />
    </main>
  );
}
