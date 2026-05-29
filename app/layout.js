import "./globals.css";
import { BP, getMeta } from "../lib/jobs.js";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

// Content-Security-Policy via <meta> — GitHub Pages can't set HTTP response
// headers, so this is the defense-in-depth layer on top of ingest-time HTML
// sanitization. meta CSP cannot express frame-ancestors / HSTS (header-only;
// see SECURITY.md). 'unsafe-inline' is required by Next's static-export
// bootstrap (no server → no nonce), but external script/connect/object loads
// and <base> hijacking are blocked.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
].join("; ");

export const metadata = {
  metadataBase: new URL(SITE),
  title: "AI Infra Jobs — GPU, CUDA & ML-Systems Engineering Roles",
  description:
    "A curated, daily-refreshed board of GPU, CUDA, ML-systems, inference and performance engineering jobs at AI labs and infrastructure startups.",
  referrer: "strict-origin-when-cross-origin",
  openGraph: {
    siteName: "WarpJobs",
    title: "AI Infra Jobs — GPU, CUDA & ML-Systems Engineering Roles",
    description:
      "Curated GPU, CUDA, ML-systems, inference & performance engineering roles at AI labs and infra startups. Daily-refreshed.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AI Infra Jobs — GPU, CUDA & ML-Systems Roles",
    description:
      "Curated GPU/CUDA/ML-systems/inference engineering roles at AI labs & infra startups. Daily-refreshed.",
  },
};

const REPO = "https://github.com/ququyixiaozei/aijobs";

export default function RootLayout({ children }) {
  const built = getMeta().generatedAt;
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
      </head>
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
