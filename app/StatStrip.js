// Dataset-stat strip — the computed "proof of dataset" that turns a filtered list
// into a curated data hub (the added-value bar Google's thin-content/doorway policy
// asks for). Server component; renders ONLY facts derived from the live corpus.
// Figures are honest "observed in current open postings", never a survey.
const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function StatStrip({ stats, showCats = false }) {
  const s = stats;
  const band = s.salCount ? `$${s.salLo}K–$${s.salHi}K` : "—";
  return (
    <div className="statstrip">
      <dl className="stats">
        <div><dt>open roles</dt><dd>{s.total}</dd></div>
        <div><dt>companies</dt><dd>{s.companies}</dd></div>
        <div><dt>list salary</dt><dd>{s.salCount}{s.salCount ? <span className="sub"> · {band}</span> : null}</dd></div>
        <div><dt>visa mention</dt><dd>{s.visa}</dd></div>
        <div><dt>remote</dt><dd>{s.remote}</dd></div>
      </dl>
      {showCats && s.byCat.length ? (
        <nav className="statcats" aria-label="Roles by specialty">
          {s.byCat.map((c) => (
            <a key={c.slug} className="pill" href={`${BP}/${c.slug}/`}>{c.name} <b>{c.n}</b></a>
          ))}
        </nav>
      ) : null}
      <p className="statnote">
        Observed across current open postings, refreshed daily — not a survey. Salary band is drawn only from roles that publish a range.
      </p>
    </div>
  );
}
