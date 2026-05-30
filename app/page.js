import JobBrowser from "./JobBrowser.js";
import { getBrowserJobs, getCategoriesLite, getMeta, BP } from "../lib/jobs.js";
import { ld } from "../lib/jsonld.js";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

export const metadata = { alternates: { canonical: "/" } };
export const revalidate = 3600;

export default function Home() {
  const jobs = getBrowserJobs();
  const cats = getCategoriesLite();
  const meta = getMeta();
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI Infra Jobs",
    alternateName: "WarpJobs",
    url: SITE + "/",
    description: "Curated GPU, CUDA, ML-systems, inference and performance engineering jobs at AI labs and infrastructure startups.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: SITE + "/?q={search_term_string}" },
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(websiteLd) }} />
      <section className="hero">
        <h1>AI Infrastructure &amp; GPU Engineering Jobs</h1>
        <p>
          {meta.count} open GPU, CUDA, ML-systems, inference &amp; performance engineering roles from{" "}
          {meta.companyCount} AI labs and infrastructure companies — one board, refreshed daily.{" "}
          <a className="hero-link" href={`${BP}/companies-hiring/`}>See who&apos;s hiring →</a>
        </p>
      </section>
      <JobBrowser jobs={jobs} cats={cats} generatedAt={meta.generatedAt} />
    </main>
  );
}
