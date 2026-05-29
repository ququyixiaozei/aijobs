import { getAllJobs, getJobBySlug, timeAgo, exactDate, companyHue, BP } from "../../../lib/jobs.js";
import { getCategory } from "../../../ingest/niche.config.mjs";
import { notFound } from "next/navigation";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllJobs().map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) return { title: "Job not found" };
  const where = job.remote ? "Remote" : job.locShort || "";
  return {
    title: `${job.title} · ${job.company}`,
    description: `${job.title} at ${job.company}.${where ? ` ${where}.` : ""}${job.salText ? ` ${job.salText}.` : ""} Apply directly on the company site.`,
    alternates: { canonical: `/jobs/${slug}/` },
  };
}

function validThrough(postedAt) {
  const base = postedAt ? new Date(postedAt) : new Date();
  base.setDate(base.getDate() + 30);
  return base.toISOString();
}

export default async function JobPage({ params }) {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) notFound();

  const cat = job.cats && job.cats.length ? getCategory(job.cats[0]) : null;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.descriptionHtml || `${job.title} at ${job.company}.`,
    datePosted: job.postedAt || undefined,
    validThrough: validThrough(job.postedAt),
    employmentType: "FULL_TIME",
    identifier: { "@type": "PropertyValue", name: job.company, value: String(job.sourceId) },
    hiringOrganization: { "@type": "Organization", name: job.company },
    ...(job.salMin
      ? { baseSalary: { "@type": "MonetaryAmount", currency: "USD", value: { "@type": "QuantitativeValue", minValue: job.salMin * 1000, maxValue: (job.salMax || job.salMin) * 1000, unitText: "YEAR" } } }
      : {}),
    ...(job.remote
      ? { jobLocationType: "TELECOMMUTE" }
      : job.locShort
      ? { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.locShort } } }
      : {}),
    url: job.url,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "All roles", item: SITE + "/" },
      ...(cat ? [{ "@type": "ListItem", position: 2, name: cat.name, item: `${SITE}/${cat.slug}/` }] : []),
      { "@type": "ListItem", position: cat ? 3 : 2, name: job.title, item: `${SITE}/jobs/${slug}/` },
    ],
  };

  return (
    <main className="detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <p><a href={`${BP}/`} className="back">← all roles</a></p>

      <div className="detail-head">
        <span className="mark lg" style={{ background: `hsl(${companyHue(job.company)} 42% 36%)` }} aria-hidden="true">
          {(job.company[0] || "?").toUpperCase()}
        </span>
        <div>
          <h1>{job.title}</h1>
          <div className="facts">
            <span className="fact co">{job.company}</span>
            {job.remote ? <span className="fact rem">Remote</span> : job.locShort ? <span className="fact">{job.locShort}</span> : null}
            {job.salText ? <span className="fact sal">{job.salText}</span> : null}
            {job.postedAt ? <span className="fact dim">posted {exactDate(job.postedAt)} · {timeAgo(job.ts)} ago</span> : null}
          </div>
        </div>
      </div>

      <p>
        <a className="apply" href={job.url} target="_blank" rel="noopener noreferrer">
          Apply at {job.company} →
        </a>
      </p>

      {job.descriptionHtml ? (
        <>
          <h2 className="jdh">Full description</h2>
          {/* descriptionHtml is allowlist-sanitized at the ingest boundary (ingest/sanitize.mjs) — never raw ATS HTML */}
          <article className="prose" dangerouslySetInnerHTML={{ __html: job.descriptionHtml }} />
        </>
      ) : (
        <p className="empty">See the full description on the company page.</p>
      )}
    </main>
  );
}
