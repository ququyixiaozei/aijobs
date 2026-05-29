import "./globals.css";
import { BP, getMeta } from "../lib/jobs.js";

export const metadata = {
  title: "AI Infra Jobs — GPU, CUDA & ML-Systems Engineering Roles",
  description:
    "A curated, daily-refreshed board of GPU, CUDA, ML-systems, inference and performance engineering jobs at AI labs and infrastructure startups.",
};

const REPO = "https://github.com/ququyixiaozei/aijobs";

export default function RootLayout({ children }) {
  const built = getMeta().generatedAt;
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container">
            <a href={`${BP}/`} className="brand">
              <span className="dot" />
              ai-infra-jobs
              <span className="sub">/ gpu · ml-systems</span>
            </a>
          </div>
        </header>

        <div className="container">{children}</div>

        <footer className="site-footer">
          <div className="container">
            <p>
              Aggregated from public company career pages (Greenhouse · Lever · Ashby APIs). Listings link to the
              original posting — we don&apos;t store applications or personal data.
            </p>
            <p>
              Auto-refreshed daily via CI{built ? ` · last build ${new Date(built).toISOString().slice(0, 16).replace("T", " ")} UTC` : ""}. Subscribe:{" "}
              <a href={`${BP}/feed.xml`}>RSS</a> · <a href={`${BP}/jobs.json`}>JSON</a>.
            </p>
            <p>
              Stale link, or a company to add? <a href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer">Open an issue</a>.
              {" "}Source &amp; scraping method: <a href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
