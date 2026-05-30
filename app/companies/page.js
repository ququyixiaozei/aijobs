import { getCompaniesLite, BP } from "../../lib/jobs.js";

export const metadata = {
  title: "Companies Hiring — AI Infra Jobs",
  description: "AI labs and infrastructure companies with open GPU, CUDA, ML-systems, inference and performance engineering roles.",
  alternates: { canonical: "/companies/" },
};
export const revalidate = 3600;

export default function Companies() {
  const cos = getCompaniesLite();
  return (
    <main>
      <section className="hero">
        <h1>Companies hiring</h1>
        <p>{cos.length} AI labs and infrastructure companies with open GPU, ML-systems, inference &amp; performance roles.</p>
      </section>
      <nav className="cats" aria-label="Companies hiring">
        {cos.map((c) => (
          <a key={c.slug} className="pill" href={`${BP}/company/${c.slug}/`}>{c.name} <b>{c.count}</b></a>
        ))}
      </nav>
    </main>
  );
}
