import { getAllJobs, getMeta, getCategories, timeAgo } from "../lib/jobs.js";

export const revalidate = 3600; // ISR: refresh hourly

export default function Home() {
  const jobs = getAllJobs();
  const meta = getMeta();
  const cats = getCategories();
  const updated = meta.generatedAt
    ? new Date(meta.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <main>
      <section className="hero">
        <h1>AI Infrastructure &amp; GPU Engineering Jobs</h1>
        <p>
          Curated GPU, CUDA, ML-systems, inference and performance roles at AI labs and
          infrastructure startups — one focused board, updated daily.
        </p>
        <div className="stat">
          <b>{meta.count}</b> open roles{updated ? ` · updated ${updated}` : ""}
        </div>
      </section>

      <nav className="cats">
        {cats.map((c) => (
          <a key={c.slug} href={`/${c.slug}`} className="pill">{c.name}</a>
        ))}
      </nav>

      {jobs.length === 0 ? (
        <p className="empty">No jobs loaded yet — run `node ingest/run.mjs` to populate data/jobs.json.</p>
      ) : (
        <ul className="jobs">
          {jobs.map((j) => (
            <li key={j.slug}>
              <a className="job" href={`/jobs/${j.slug}`}>
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
