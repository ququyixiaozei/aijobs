import "./globals.css";
import { BP } from "../lib/jobs.js";

export const metadata = {
  title: "AI Infra Jobs — GPU, CUDA & ML-Systems Engineering Roles",
  description:
    "A curated board of GPU, CUDA, ML-systems, inference and performance engineering jobs at AI labs and infrastructure startups.",
};

export default function RootLayout({ children }) {
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
            <p>Aggregated from public company career pages. Listings link to the original posting. Updated daily.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
