import { getBrowserJobs, getMeta, statsFor, BP } from "../../lib/jobs.js";
import { categories } from "../../ingest/niche.config.mjs";
import { kebab } from "../../lib/derive.js";
import StatStrip from "../StatStrip.js";
import { ld } from "../../lib/jsonld.js";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

export const revalidate = 3600;

export const metadata = {
  title: "Which AI Labs & Infra Startups Are Hiring GPU / Inference Engineers — AI Infra Jobs",
  description:
    "A live, daily-refreshed leaderboard of the AI labs and infrastructure startups hiring GPU, CUDA, ML-systems, inference and performance engineers — ranked by open roles, with the specialty, salary and visa mix for each.",
  alternates: { canonical: "/companies-hiring/" },
};

// short column headers for the dense leaderboard (one per category, in config order)
const CAT_COLS = categories.map((c) => ({
  slug: c.slug,
  short: { "gpu-jobs": "GPU", "ml-systems-jobs": "ML-sys", "inference-jobs": "Inf", "performance-engineering-jobs": "Perf" }[c.slug] || c.name,
}));

export default function CompaniesHiring() {
  const jobs = getBrowserJobs();
  const meta = getMeta();
  const stats = statsFor(jobs);

  // per-company rollup (pure aggregation over the existing corpus)
  const byCo = new Map();
  for (const j of jobs) {
    const slug = kebab(j.company);
    if (!byCo.has(slug)) byCo.set(slug, { slug, name: j.company, total: 0, cat: {}, remote: 0, visa: 0, sal: 0 });
    const e = byCo.get(slug);
    e.total++;
    if (j.remote) e.remote++;
    if (j.visa) e.visa++;
    if (j.salMin) e.sal++;
    for (const c of j.cats || []) e.cat[c] = (e.cat[c] || 0) + 1;
  }
  const rows = [...byCo.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "All roles", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Who's hiring", item: SITE + "/companies-hiring/" },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd) }} />
      <section className="hero">
        <p><a href={`${BP}/`} className="back">← all roles</a></p>
        <h1>Who&apos;s hiring GPU, inference &amp; ML-systems engineers right now</h1>
        <p>
          {stats.companies} AI labs and infrastructure companies have {stats.total} open GPU, CUDA, ML-systems,
          inference and performance engineering roles between them. Ranked by openings, refreshed daily from each
          company&apos;s own public job feed.
        </p>
      </section>

      <StatStrip stats={stats} showCats />

      <section className="editorial">
        <p>
          The useful question for someone in this field usually isn&apos;t &ldquo;what jobs exist&rdquo; — a search box
          answers that — but <strong>which companies are actually staffing up, and for what</strong>. That is what this
          page tracks. The shape of the demand is fairly consistent: dedicated AI-silicon companies (the Graphcores and
          Tenstorrents of the list) skew heavily toward performance, compiler and kernel work, because their whole product
          is making specific hardware fast. GPU-cloud and infrastructure providers (CoreWeave, Nebius and similar) hire
          for the systems and reliability side — operating accelerator fleets, not designing them. Frontier labs
          concentrate in inference and ML-systems, where the bottleneck is serving large models efficiently and training
          them across thousands of GPUs.
        </p>
        <p>
          Two numbers worth reading off the table: how many of a company&apos;s roles <em>disclose a salary band</em>
          {" "}(a rough proxy for hiring maturity and US-comp transparency norms) and how many <em>mention visa
          sponsorship or relocation</em> — the single most decision-relevant fact for an engineer hiring across borders.
          Counts move as companies open and close postings; this is a snapshot of the current open set, not a survey.
        </p>
      </section>

      <div className="lbwrap">
        <table className="leaderboard">
          <thead>
            <tr>
              <th className="lb-co">Company</th>
              <th className="lb-n">Open</th>
              {CAT_COLS.map((c) => <th key={c.slug} className="lb-c">{c.short}</th>)}
              <th className="lb-c">Rem</th>
              <th className="lb-c">Visa</th>
              <th className="lb-c">$</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug}>
                <td className="lb-co"><a href={`${BP}/company/${r.slug}/`}>{r.name}</a></td>
                <td className="lb-n"><b>{r.total}</b></td>
                {CAT_COLS.map((c) => (
                  <td key={c.slug} className="lb-c">{r.cat[c.slug] ? r.cat[c.slug] : <span className="z">·</span>}</td>
                ))}
                <td className="lb-c">{r.remote || <span className="z">·</span>}</td>
                <td className="lb-c">{r.visa || <span className="z">·</span>}</td>
                <td className="lb-c">{r.sal || <span className="z">·</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="hubnav">
        Browse by cut:{" "}
        <a href={`${BP}/remote/`}>Remote</a> · <a href={`${BP}/region/europe/`}>Europe</a> ·{" "}
        <a href={`${BP}/level/senior/`}>Senior</a> · <a href={`${BP}/level/staff/`}>Staff</a> ·{" "}
        {categories.map((c, i) => (
          <span key={c.slug}>{i ? " · " : ""}<a href={`${BP}/${c.slug}/`}>{c.name.replace(" Jobs", "")}</a></span>
        ))}
      </p>

      <p className="result-meta">
        {meta.generatedAt ? `Refreshed ${new Date(meta.generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC` : ""}
      </p>
    </main>
  );
}
