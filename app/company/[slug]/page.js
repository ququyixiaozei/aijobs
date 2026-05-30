import JobBrowser from "../../JobBrowser.js";
import { getJobsByCompany, getCompaniesLite, getCompanyBySlug, getMeta, statsFor, isIndexableCompany, robotsFor, BP } from "../../../lib/jobs.js";
import StatStrip from "../../StatStrip.js";
import { ld } from "../../../lib/jsonld.js";
import { notFound } from "next/navigation";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return getCompaniesLite().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = getCompanyBySlug(slug);
  if (!c) return { title: "Not found" };
  return {
    title: `${c.name} — GPU & ML-Systems Jobs · WarpJobs`,
    description: `Open GPU, CUDA, ML-systems, inference and performance engineering roles at ${c.name}. Refreshed daily; apply directly on ${c.name}'s site.`,
    alternates: { canonical: `/company/${slug}/` },
    // single-/low-job company wrappers stay live+follow but out of the index (thin)
    robots: robotsFor(isIndexableCompany(c.count)),
  };
}

export default async function CompanyPage({ params }) {
  const { slug } = await params;
  const c = getCompanyBySlug(slug);
  if (!c) notFound();
  const jobs = getJobsByCompany(slug);
  const meta = getMeta();
  const stats = statsFor(jobs);
  const top = stats.byCat[0];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "All roles", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Companies", item: SITE + "/companies/" },
      { "@type": "ListItem", position: 3, name: c.name, item: `${SITE}/company/${slug}/` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd) }} />
      <section className="hero">
        <p><a href={`${BP}/companies/`} className="back">← all companies</a></p>
        <h1>{c.name}</h1>
        <p>
          {c.count} open GPU, ML-systems, inference &amp; performance engineering role{c.count === 1 ? "" : "s"} at {c.name},
          refreshed daily — each links to {c.name}&apos;s own application page.
        </p>
      </section>

      {c.count >= 2 ? (
        <>
          <StatStrip stats={stats} showCats />
          {top ? (
            <section className="editorial">
              <p>
                {c.name}&apos;s open engineering roles here skew toward{" "}
                <a href={`${BP}/${top.slug}/`}>{top.name.replace(" Jobs", "").toLowerCase()}</a>
                {" "}({top.n} of {c.count}){stats.salCount ? `, and ${stats.salCount} disclose a salary band ($${stats.salLo}K–$${stats.salHi}K)` : ""}
                {stats.visa ? `; ${stats.visa} mention visa sponsorship or relocation` : ""}. Apply on {c.name}&apos;s
                own site — WarpJobs links out and never handles applications.
              </p>
            </section>
          ) : null}
        </>
      ) : null}

      <JobBrowser jobs={jobs} cats={[]} generatedAt={meta.generatedAt} />
    </main>
  );
}
