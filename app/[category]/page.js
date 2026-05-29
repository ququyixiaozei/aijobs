import JobBrowser from "../JobBrowser.js";
import { getBrowserJobs, getCategoriesLite, getMeta, BP } from "../../lib/jobs.js";
import { getCategory } from "../../ingest/niche.config.mjs";
import { notFound } from "next/navigation";

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
    title: `${c.name} — AI Infra Jobs`,
    description: `Open ${c.name.toLowerCase()} at AI labs and infrastructure startups. Refreshed daily.`,
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) notFound();
  const jobs = getBrowserJobs();
  const cats = getCategoriesLite();
  const meta = getMeta();

  return (
    <main>
      <section className="hero">
        <p><a href={`${BP}/`} className="back">← all roles</a></p>
        <h1>{c.name}</h1>
      </section>
      <JobBrowser jobs={jobs} cats={cats} initialCat={category} generatedAt={meta.generatedAt} />
    </main>
  );
}
