"use client";
import { useState, useMemo, useEffect, useRef } from "react";

const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function JobBrowser({ jobs, cats, initialCat = "", generatedAt }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(initialCat);
  const [remote, setRemote] = useState(false);
  const [sort, setSort] = useState("new");
  const inputRef = useRef(null);

  // "/" focuses search — the reflex for technical users
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current && inputRef.current.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    let r = jobs.filter((j) => {
      if (cat && !(j.cats || []).includes(cat)) return false;
      if (remote && !j.remote) return false;
      if (tokens.length) {
        const hay = (j.title + " " + j.company + " " + j.locShort).toLowerCase();
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    r = [...r].sort(
      sort === "company"
        ? (a, b) => a.company.localeCompare(b.company) || b.ts - a.ts
        : (a, b) => b.ts - a.ts
    );
    return r;
  }, [jobs, q, cat, remote, sort]);

  return (
    <div>
      <div className="controls">
        <input
          ref={inputRef}
          className="search"
          type="search"
          placeholder="Search title, company, location    ( / )"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search roles"
        />
        <div className="control-row">
          <button className={"chip" + (remote ? " active" : "")} onClick={() => setRemote((v) => !v)} aria-pressed={remote}>
            Remote
          </button>
          <span className="spacer" />
          <span className="sortlbl">sort</span>
          <button className={"chip" + (sort === "new" ? " active" : "")} onClick={() => setSort("new")}>newest</button>
          <button className={"chip" + (sort === "company" ? " active" : "")} onClick={() => setSort("company")}>company</button>
        </div>
        <div className="cats">
          <button className={"pill" + (cat === "" ? " active" : "")} onClick={() => setCat("")}>
            All <b>{jobs.length}</b>
          </button>
          {cats.map((c) => (
            <button
              key={c.slug}
              className={"pill" + (cat === c.slug ? " active" : "")}
              onClick={() => setCat((v) => (v === c.slug ? "" : c.slug))}
            >
              {c.name} <b>{c.count}</b>
            </button>
          ))}
        </div>
      </div>

      <div className="result-meta">
        {results.length} role{results.length === 1 ? "" : "s"}
        {generatedAt ? ` · data refreshed ${new Date(generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC` : ""}
      </div>

      <div className="jobgrid">
        {results.map((j) => (
          <a key={j.slug} className="jobrow" href={`${BP}/jobs/${j.slug}/`} title={j.title}>
            <span className="mark" style={{ background: `hsl(${j.hue} 42% 36%)` }} aria-hidden="true">
              {(j.company[0] || "?").toUpperCase()}
            </span>
            <span className="jt">{j.title}</span>
            <span className="jc">{j.company}</span>
            <span className="jl">
              {j.remote ? <span className="rem">Remote</span> : j.locShort || "—"}
              {j.salary ? <span className="sal">{j.salary}</span> : null}
            </span>
            <span className="jd">{j.age}</span>
          </a>
        ))}
        {results.length === 0 && <div className="empty">No roles match — clear filters or broaden the search.</div>}
      </div>
    </div>
  );
}
