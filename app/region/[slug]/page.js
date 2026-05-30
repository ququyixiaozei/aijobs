import JobBrowser from "../../JobBrowser.js";
import { getJobsByRegion, getMeta, statsFor, isIndexableSlice, robotsFor, BP } from "../../../lib/jobs.js";
import StatStrip from "../../StatStrip.js";
import { ld } from "../../../lib/jsonld.js";
import { notFound } from "next/navigation";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

// Region hubs we publish. Europe (continental EU + UK) is the one regional cut with
// inventory above the thin-content floor — it pairs the UK silicon cluster
// (Graphcore, Tenstorrent) with continental labs. Each entry auto-noindexes if its
// live, deduped count drops below the floor (isIndexableSlice). Add more cuts here
// only once GSC shows real query demand AND the count clears the floor.
const REGIONS = {
  europe: {
    regions: ["EU", "UK"],
    where: "Europe",
    title: "GPU, AI-Chip & ML-Infrastructure Jobs in Europe — AI Infra Jobs",
    h1: "GPU, AI-chip & ML-infrastructure jobs in Europe",
    description:
      "Open GPU, accelerator, ML-systems and performance engineering roles across Europe — UK AI-silicon (Graphcore, Tenstorrent) and continental labs and GPU-cloud providers. Refreshed daily.",
    editorial:
      "Europe's AI-infrastructure hiring has a shape you don't see in the US numbers: it is anchored by home-grown silicon. Graphcore, headquartered in Bristol, is one of the few companies anywhere designing an AI accelerator from the ground up; Tenstorrent and others add to a dense pocket of compiler, kernel and performance work in the UK. On the continent the picture leans toward the labs and GPU-cloud providers — Mistral in Paris, Nebius and similar — hiring for systems, HPC and inference rather than chip design. For an engineer relocating, the visa-sponsorship and relocation figure in the stats below is the one that actually matters: European roles in this set skew toward companies set up to hire internationally.",
  },
};

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(REGIONS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const r = REGIONS[slug];
  if (!r) return { title: "Not found" };
  const count = getJobsByRegion(r.regions).length;
  return {
    title: r.title,
    description: r.description,
    alternates: { canonical: `/region/${slug}/` },
    robots: robotsFor(isIndexableSlice(count)),
  };
}

export default async function RegionPage({ params }) {
  const { slug } = await params;
  const r = REGIONS[slug];
  if (!r) notFound();
  const jobs = getJobsByRegion(r.regions);
  const meta = getMeta();
  const stats = statsFor(jobs);
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "All roles", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: r.h1, item: `${SITE}/region/${slug}/` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd) }} />
      <section className="hero">
        <p><a href={`${BP}/companies-hiring/`} className="back">← who&apos;s hiring</a></p>
        <h1>{r.h1}</h1>
        <p>{stats.total} open GPU, accelerator, ML-systems and performance engineering role{stats.total === 1 ? "" : "s"} in {r.where}, refreshed daily.</p>
      </section>

      <StatStrip stats={stats} showCats />

      <section className="editorial">
        <p>{r.editorial}</p>
      </section>

      <JobBrowser jobs={jobs} cats={[]} generatedAt={meta.generatedAt} />
    </main>
  );
}
