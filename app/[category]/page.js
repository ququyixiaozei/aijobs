import { getCategories, getJobsByCategory, timeAgo, BP } from "../../lib/jobs.js";
import { getCategory } from "../../ingest/niche.config.mjs";
import { notFound } from "next/navigation";

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return { title: "Not found" };
  return {
    title: `${c.name} — AI Infra Jobs`,
    description: `Open ${c.name.toLowerCase()} at AI labs and infrastructure startups. Updated daily.`,
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const c = getCategory(category);
  const jobs = getJobsByCategory(category);
  if (!c || jobs === null) notFound();

  return (
    <main>
      <section className="hero">
        <p><a href={`${BP}/`} className="back">← all roles</a></p>
        <h1>{c.name}</h1>
        <div className="stat"><b>{jobs.length}</b> open roles</div>
      </section>

      {jobs.length === 0 ? (
        <p className="empty">No matching roles right now — check back soon.</p>
      ) : (
        <ul className="jobs">
          {jobs.map((j) => (
            <li key={j.slug}>
              <a className="job" href={`${BP}/jobs/${j.slug}/`}>
                <div className="title">{j.title}</div>
                <div className="meta">
                  <span className="co">{j.company}</span>
                  {j.location ? ` · ${j.location}` : ""}
                  {j.postedAt ? ` · ${timeAgo(j.postedAt)}` : ""}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
