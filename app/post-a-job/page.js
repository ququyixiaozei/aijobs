import { getMeta, BP } from "../../lib/jobs.js";

// Price-anchored employer intake (fake-door, D126). Pre-committed reading:
// 0 requests at ~0 traffic = UNINFORMATIVE (not "tested and failed");
// ≥1 unsolicited request = a real scarcity-driven demand signal → decision memo.
const REPO = "https://github.com/ququyixiaozei/aijobs";

export const metadata = {
  title: "Post a role — WarpJobs",
  description:
    "Get your GPU/CUDA/ML-systems or inference engineering role in front of the engineers who browse WarpJobs. Free aggregation for public ATS boards; featured placement available.",
  alternates: { canonical: "/post-a-job/" },
};

export default function PostAJob() {
  const { companyCount } = getMeta();
  return (
    <main className="detail">
      <h1>Post a role</h1>

      <h2 className="jdh">Free — automatic aggregation</h2>
      <p>
        WarpJobs ingests roles daily from companies&apos; public ATS feeds (Greenhouse, Lever, Ashby).
        If your company posts GPU/CUDA, ML-systems, inference or performance-engineering roles on one of
        those, your listings appear here automatically and free — alongside {companyCount} companies
        already tracked. Not seeing yours?{" "}
        <a href={`${REPO}/issues/new?template=post-a-role.yml`} target="_blank" rel="noopener noreferrer">
          Request your board be added
        </a>{" "}
        (takes one day).
      </p>

      <h2 className="jdh">Featured listing — $99 / 30 days</h2>
      <p>
        A featured role is pinned to the top of the board and every matching category page for 30 days,
        marked as featured, and included in the RSS/JSON feeds first. One role, one fee, no subscription.
      </p>
      <p>
        <a
          className="apply"
          href={`${REPO}/issues/new?template=post-a-role.yml&title=${encodeURIComponent("Featured post request: ")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Request a featured post →
        </a>
      </p>
      <p className="empty">
        We reply with payment details and go live the same day. No charge until you confirm.
      </p>

      <p>
        <a href={`${BP}/`} className="back">← back to all roles</a>
      </p>
    </main>
  );
}
