import JobBrowser from "../JobBrowser.js";
import { getRemoteJobs, getMeta, statsFor, isIndexableSlice, robotsFor, BP } from "../../lib/jobs.js";
import StatStrip from "../StatStrip.js";
import { ld } from "../../lib/jsonld.js";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

export const revalidate = 3600;

export async function generateMetadata() {
  const count = getRemoteJobs().length;
  return {
    title: "Remote GPU, Inference & ML-Systems Jobs (Updated Daily) — WarpJobs",
    description:
      "Remote GPU, CUDA, ML-systems, inference and performance engineering roles at AI labs and infrastructure startups — and an honest look at how rare remote really is in this niche. Refreshed daily.",
    alternates: { canonical: "/remote/" },
    // remote is the thinnest indexed slice; if a daily refresh drops it below the
    // floor it self-demotes to noindex,follow rather than shipping a thin page
    robots: robotsFor(isIndexableSlice(count)),
  };
}

export default function RemotePage() {
  const jobs = getRemoteJobs();
  const meta = getMeta();
  const stats = statsFor(jobs);
  const all = getMeta().count;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "All roles", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Remote", item: SITE + "/remote/" },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd) }} />
      <section className="hero">
        <p><a href={`${BP}/`} className="back">← all roles</a></p>
        <h1>Remote GPU, inference &amp; ML-systems jobs — the real numbers</h1>
        <p>
          Here is the honest picture most boards won&apos;t give you: of {all} open roles in this niche right now, only{" "}
          <strong>{stats.total}</strong> are remote. GPU and accelerator work stays close to the hardware, the labs, and
          the data centers — so remote is the exception, not the default. These are the ones that exist today.
        </p>
      </section>

      <StatStrip stats={stats} showCats />

      <section className="editorial">
        <p>
          The scarcity is structural, not a fluke of the moment. A large share of this field is kernel, silicon and
          cluster work that is tied to specific hardware, secure facilities, or co-location with a research team — none
          of which travels well over a VPN. When remote roles do appear here they cluster on the software-heavier end
          (inference, frameworks, tooling) rather than the hands-on-hardware end. If remote is a hard requirement,
          filter and sort below; if it&apos;s a preference, it&apos;s worth widening to hybrid, because the inventory is
          genuinely thin and refreshes daily.
        </p>
      </section>

      <JobBrowser jobs={jobs} cats={[]} generatedAt={meta.generatedAt} />
    </main>
  );
}
