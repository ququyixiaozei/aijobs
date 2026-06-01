import { getSalaryReport, getMeta, isIndexableSlice, robotsFor, BP } from "../../lib/jobs.js";
import { ld } from "../../lib/jsonld.js";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

export const revalidate = 3600;

const k = (v) => (v ? `$${v}K` : "—");

export function generateMetadata() {
  const r = getSalaryReport();
  return {
    title: "GPU & AI-Infra Engineer Salaries (Live Data) — AI Infra Jobs",
    description:
      `Median pay for GPU, CUDA, inference, ML-systems and performance engineers — segmented by specialty, level and company, ` +
      `from ${r.overall.n} live disclosed salary ranges across AI-infrastructure employers. Refreshed daily.`,
    alternates: { canonical: "/salaries/" },
    // Auto-noindex if the disclosed sample ever thins below the slice floor (same
    // guardrail philosophy as the hub pages) — one substantive page, not a survey.
    robots: robotsFor(isIndexableSlice(r.overall.n)),
  };
}

function SalTable({ firstCol, rows }) {
  return (
    <div className="lbwrap">
      <table className="leaderboard">
        <thead>
          <tr>
            <th className="lb-co">{firstCol}</th>
            <th className="lb-n">Roles</th>
            <th className="lb-c">Median low</th>
            <th className="lb-c">Median high</th>
            <th className="lb-c">Midpoint</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.key || x.slug || x.name || x.label}>
              <td className="lb-co">{x.href ? <a href={x.href}>{x.label || x.name}</a> : (x.label || x.name)}</td>
              <td className="lb-n"><b>{x.n}</b></td>
              <td className="lb-c">{k(x.lo)}</td>
              <td className="lb-c">{k(x.hi)}</td>
              <td className="lb-c">{k(x.mid)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SalariesPage() {
  const r = getSalaryReport();
  const meta = getMeta();

  const specRows = r.bySpecialty.map((x) => ({ ...x, href: `${BP}/${x.slug}/` }));
  const coRows = r.byCompany.map((x) => ({ ...x, href: `${BP}/company/${x.slug}/` }));

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "All roles", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Salaries", item: `${SITE}/salaries/` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd) }} />

      <section className="hero">
        <p><a href={`${BP}/companies-hiring/`} className="back">← who&apos;s hiring</a></p>
        <h1>AI infrastructure &amp; GPU engineer salaries</h1>
        <p>
          Median base pay across {r.overall.n} live disclosed salary ranges for GPU, CUDA, inference, ML-systems and
          performance engineering roles — overall {k(r.overall.lo)}–{k(r.overall.hi)} (midpoint {k(r.overall.mid)}).
          Refreshed daily from each employer&apos;s own postings.
        </p>
      </section>

      <section className="editorial">
        <p>
          These figures come from the salary ranges AI-infrastructure employers publish directly in their own job
          postings — {r.disclosed} of {r.total} current openings disclose a band, and {r.overall.n} of those are precise
          enough to use (legal placeholder ranges wider than 2.3&times; their floor are excluded, the same rule the
          structured data uses). Unlike a general salary aggregator, every number here is segmented to this one niche:
          GPU, CUDA, inference, ML-systems and performance engineering, across the AI labs, accelerator makers and
          GPU-cloud providers actively hiring for it. It is a snapshot of what is open right now, not a survey of the
          whole market.
        </p>
        <p>
          The clearest pattern is the gap between frontier labs and infrastructure providers: the labs disclose the
          highest bands in the set, while GPU-cloud and accelerator companies cluster noticeably lower. By specialty,
          inference and model-serving roles tend to pay above raw GPU/kernel and performance work. Read the role count
          (<em>Roles</em>) next to every figure — a median over a handful of postings is indicative, not authoritative,
          and the numbers shift as roles open and close.
        </p>
      </section>

      <h2 className="jdh">By specialty</h2>
      <SalTable firstCol="Specialty" rows={specRows} />

      <h2 className="jdh">By level</h2>
      <SalTable firstCol="Level" rows={r.byLevel} />

      <h2 className="jdh">By company</h2>
      <SalTable firstCol="Company" rows={coRows} />

      <p className="statnote">
        Medians over base-salary ranges disclosed in the postings, in USD (nearly all disclosure in this set is US).
        Placeholder ranges &ge;2.3&times; their floor are excluded; segments with fewer than {r.minN} disclosed ranges
        are omitted as too thin to report. Recomputed daily from the live feed.
      </p>

      <p className="hubnav">
        Browse the roles behind these numbers:{" "}
        <a href={`${BP}/companies-hiring/`}>Who&apos;s hiring</a> ·{" "}
        <a href={`${BP}/`}>All roles</a> ·{" "}
        {specRows.map((c, i) => (
          <span key={c.slug}>{i ? " · " : ""}<a href={`${BP}/${c.slug}/`}>{c.label}</a></span>
        ))}
      </p>

      <p className="result-meta">
        {meta.generatedAt ? `Refreshed ${new Date(meta.generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC` : ""}
      </p>
    </main>
  );
}
