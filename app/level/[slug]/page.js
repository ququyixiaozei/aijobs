import JobBrowser from "../../JobBrowser.js";
import { getJobsByLevel, getMeta, statsFor, isIndexableSlice, robotsFor, BP } from "../../../lib/jobs.js";
import StatStrip from "../../StatStrip.js";
import { ld } from "../../../lib/jsonld.js";
import { notFound } from "next/navigation";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

const LEVELS = {
  senior: {
    level: "senior",
    title: "Senior GPU, CUDA & ML-Infrastructure Engineer Jobs — AI Infra Jobs",
    h1: "Senior GPU, CUDA & ML-infrastructure engineer roles",
    description:
      "Open senior-level GPU, CUDA, ML-systems, inference and performance engineering roles at AI labs and infrastructure startups. Refreshed daily.",
    editorial:
      "At senior level in this niche the bar is usually demonstrated ownership of a hard system end-to-end — a kernel that shipped, an inference path you took from prototype to production, a training run you kept alive at scale — rather than years served. It is the largest level bucket on the board, which fits the field: the work is specialized enough that companies are mostly hiring people who already have the scars, not training them up. Senior here typically still means hands-on-keyboard depth, distinct from the staff and principal roles that lean toward cross-team technical direction.",
    sibling: ["staff", "Staff & principal roles"],
  },
  staff: {
    level: "staff",
    title: "Staff-Level GPU, Inference & ML-Systems Engineer Jobs — AI Infra Jobs",
    h1: "Staff & principal accelerator and ML-systems roles",
    description:
      "Open staff- and principal-level GPU, accelerator, inference and ML-systems engineering roles at AI labs and infrastructure startups. Refreshed daily.",
    editorial:
      "Staff- and principal-level roles here are where deep technical scope meets leverage across teams: owning the architecture of an inference stack, setting the kernel or compiler strategy, or being the person a frontier lab trusts to make the call on a hardware-software trade-off worth millions in compute. Note one honest counting detail — “Member of Technical Staff”, common at the labs, is deliberately not counted as staff-level here (it spans seniorities), so this set is genuinely the principal/architect tier rather than a title artifact.",
    sibling: ["senior", "Senior roles"],
  },
};

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(LEVELS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const l = LEVELS[slug];
  if (!l) return { title: "Not found" };
  const count = getJobsByLevel(l.level).length;
  return {
    title: l.title,
    description: l.description,
    alternates: { canonical: `/level/${slug}/` },
    robots: robotsFor(isIndexableSlice(count)),
  };
}

export default async function LevelPage({ params }) {
  const { slug } = await params;
  const l = LEVELS[slug];
  if (!l) notFound();
  const jobs = getJobsByLevel(l.level);
  const meta = getMeta();
  const stats = statsFor(jobs);
  const [sibSlug, sibLabel] = l.sibling;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "All roles", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: l.h1, item: `${SITE}/level/${slug}/` },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd) }} />
      <section className="hero">
        <p><a href={`${BP}/companies-hiring/`} className="back">← who&apos;s hiring</a></p>
        <h1>{l.h1}</h1>
        <p>{stats.total} open {l.level}-level GPU, ML-systems, inference &amp; performance role{stats.total === 1 ? "" : "s"} across {stats.companies} companies, refreshed daily.</p>
      </section>

      <StatStrip stats={stats} showCats />

      <section className="editorial">
        <p>{l.editorial}</p>
        <p className="tophiring"><span className="lbl">See also:</span> <a href={`${BP}/level/${sibSlug}/`}>{sibLabel}</a> · <a href={`${BP}/companies-hiring/`}>who&apos;s hiring →</a></p>
      </section>

      <JobBrowser jobs={jobs} cats={[]} generatedAt={meta.generatedAt} />
    </main>
  );
}
