import JobBrowser from "./JobBrowser.js";
import { getBrowserJobs, getCategoriesLite, getMeta } from "../lib/jobs.js";

export const revalidate = 3600;

export default function Home() {
  const jobs = getBrowserJobs();
  const cats = getCategoriesLite();
  const meta = getMeta();
  return (
    <main>
      <section className="hero">
        <h1>AI Infrastructure &amp; GPU Engineering Jobs</h1>
        <p>
          Every GPU, CUDA, ML-systems, inference &amp; performance role at AI labs and infrastructure
          startups — one board, refreshed daily.
        </p>
      </section>
      <JobBrowser jobs={jobs} cats={cats} generatedAt={meta.generatedAt} />
    </main>
  );
}
