import JobBrowser from "../JobBrowser.js";
import { getBrowserJobs, getCategoriesLite, getMeta, statsFor, isIndexableSlice, robotsFor, BP } from "../../lib/jobs.js";
import { getCategory } from "../../ingest/niche.config.mjs";
import StatStrip from "../StatStrip.js";
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
  const count = getBrowserJobs().filter((j) => (j.cats || []).includes(category)).length;
  return {
    title: `${c.name} — WarpJobs`,
    description: c.blurb || `Open ${c.name.toLowerCase()} at AI labs and infrastructure startups. Refreshed daily.`,
    alternates: { canonical: `/${category}/` },
    // thin slices (e.g. ml-systems when the live count dips under the floor) drop out
    // of the index but stay crawlable+follow — see isIndexableSlice in lib/jobs.js
    robots: robotsFor(isIndexableSlice(count)),
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) notFound();
  const jobs = getBrowserJobs();
  const catJobs = jobs.filter((j) => (j.cats || []).includes(category));
  const cats = getCategoriesLite();
  const meta = getMeta();
  const stats = statsFor(catJobs);
  const count = catJobs.length;
  const topCos = stats.topCompanies.slice(0, 6);

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

      <StatStrip stats={stats} />

      {c.editorial ? (
        <section className="editorial">
          <p>{c.editorial}</p>
          {topCos.length ? (
            <p className="tophiring">
              <span className="lbl">Hiring most for this specialty:</span>{" "}
              {topCos.map((co, i) => (
                <span key={co.slug}>{i ? " · " : ""}<a href={`${BP}/company/${co.slug}/`}>{co.name} <b>{co.n}</b></a></span>
              ))}
              {" · "}<a href={`${BP}/companies-hiring/`}>see all who&apos;s hiring →</a>
            </p>
          ) : null}
        </section>
      ) : null}

      <JobBrowser jobs={jobs} cats={cats} initialCat={category} generatedAt={meta.generatedAt} />
    </main>
  );
}
