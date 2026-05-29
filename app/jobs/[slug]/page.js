import { getAllJobs, getJobBySlug, timeAgo } from "../../../lib/jobs.js";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllJobs().map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) return { title: "Job not found" };
  return {
    title: `${job.title} · ${job.company}`,
    description: `${job.title} at ${job.company}${job.location ? ` (${job.location})` : ""}.`,
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
    ...(job.location
      ? { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } } }
      : { jobLocationType: "TELECOMMUTE" }),
    url: job.url,
  };

  return (
    <main className="detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p><a href="/" className="back">← all roles</a></p>
      <h1>{job.title}</h1>
      <p className="meta">
        <span className="co">{job.company}</span>
        {job.location ? ` · ${job.location}` : ""}
        {job.department ? ` · ${job.department}` : ""}
        {job.postedAt ? ` · ${timeAgo(job.postedAt)}` : ""}
      </p>
      <p>
        <a className="apply" href={job.url} target="_blank" rel="noopener noreferrer">
          Apply at {job.company} →
        </a>
      </p>
      {job.descriptionHtml ? (
        <article className="prose" dangerouslySetInnerHTML={{ __html: job.descriptionHtml }} />
      ) : (
        <p className="empty">See the full description on the company page.</p>
      )}
    </main>
  );
}
