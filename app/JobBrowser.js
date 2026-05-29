"use client";
import { useState, useMemo, useEffect, useRef } from "react";

const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";
const REGIONS = ["US", "EU", "UK", "Remote", "APAC"];
const SAL_STEPS = [0, 200, 300, 400];

function useLocalSet(key) {
  const [set, setSet] = useState(() => new Set());
  useEffect(() => {
    try { setSet(new Set(JSON.parse(localStorage.getItem(key) || "[]"))); } catch {}
  }, [key]);
  const toggle = (v) => setSet((prev) => {
    const next = new Set(prev);
    next.has(v) ? next.delete(v) : next.add(v);
    try { localStorage.setItem(key, JSON.stringify([...next])); } catch {}
    return next;
  });
  const add = (v) => setSet((prev) => {
    if (prev.has(v)) return prev;
    const next = new Set(prev); next.add(v);
    try { localStorage.setItem(key, JSON.stringify([...next])); } catch {}
    return next;
  });
  return [set, toggle, add];
}

export default function JobBrowser({ jobs, cats, initialCat = "", generatedAt }) {
  const [q, setQ] = useState("");
  const cat = initialCat; // category is a real page/URL (/[category]/) — crawlable, not client state
  const [regions, setRegions] = useState(() => new Set());
  const [visaOnly, setVisaOnly] = useState(false);
  const [minSal, setMinSal] = useState(0);
  const [sort, setSort] = useState("new");
  const [starredOnly, setStarredOnly] = useState(false);
  const [density, setDensity] = useState("compact"); // B-22: dense by default (heavy scanners)
  const [stars, toggleStar] = useLocalSet("aijobs:stars");
  const [visited, , addVisited] = useLocalSet("aijobs:visited");
  const inputRef = useRef(null);

  useEffect(() => {
    try { const d = localStorage.getItem("aijobs:density"); if (d) setDensity(d); } catch {}
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault(); inputRef.current && inputRef.current.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const setDens = (d) => { setDensity(d); try { localStorage.setItem("aijobs:density", d); } catch {} };
  const toggleRegion = (r) => setRegions((p) => { const n = new Set(p); n.has(r) ? n.delete(r) : n.add(r); return n; });

  const results = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    const r = jobs.filter((j) => {
      if (cat && !(j.cats || []).includes(cat)) return false;
      if (regions.size && !regions.has(j.region)) return false;
      if (visaOnly && !j.visa) return false;
      if (minSal && !(j.salMin >= minSal)) return false;
      if (starredOnly && !stars.has(j.slug)) return false;
      if (tokens.length) {
        const hay = (j.title + " " + j.company + " " + (j.locations || []).join(" ")).toLowerCase();
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    const cmp = {
      company: (a, b) => a.company.localeCompare(b.company) || b.ts - a.ts,
      salary: (a, b) => (b.salMin || 0) - (a.salMin || 0) || b.ts - a.ts,
      new: (a, b) => b.ts - a.ts,
    }[sort];
    return [...r].sort(cmp);
  }, [jobs, q, cat, regions, visaOnly, minSal, starredOnly, stars, sort]);

  return (
    <div className={"browser " + density}>
      <div className="controls">
        <input ref={inputRef} className="search" type="search" value={q}
          placeholder="Search title, company, location    ( / )"
          onChange={(e) => setQ(e.target.value)} aria-label="Search roles" />

        {/* Filter group */}
        <div className="group">
          <span className="glabel">filter</span>
          {REGIONS.map((r) => (
            <button key={r} className={"chip" + (regions.has(r) ? " active" : "")} aria-pressed={regions.has(r)} onClick={() => toggleRegion(r)}>{r}</button>
          ))}
          <span className="sep" />
          <button className={"chip" + (visaOnly ? " active" : "")} aria-pressed={visaOnly} onClick={() => setVisaOnly((v) => !v)}>visa</button>
          <span className="sep" />
          {SAL_STEPS.map((s) => (
            <button key={s} className={"chip" + (minSal === s ? " active" : "")} onClick={() => setMinSal(s)}>{s ? `$${s}K+` : "$ any"}</button>
          ))}
          <span className="sep" />
          <button className={"chip" + (starredOnly ? " active" : "")} aria-pressed={starredOnly} onClick={() => setStarredOnly((v) => !v)}>★ saved{stars.size ? ` ${stars.size}` : ""}</button>
        </div>

        {/* View group */}
        <div className="group view">
          <span className="glabel">view</span>
          {["new", "salary", "company"].map((s) => (
            <button key={s} className={"chip" + (sort === s ? " active" : "")} onClick={() => setSort(s)}>{s === "new" ? "newest" : s}</button>
          ))}
          <span className="sep" />
          <button className={"chip" + (density === "compact" ? " active" : "")} onClick={() => setDens("compact")}>compact</button>
          <button className={"chip" + (density === "comfortable" ? " active" : "")} onClick={() => setDens("comfortable")}>comfortable</button>
        </div>

        {/* Real links to crawlable category pages (SEO internal linking) — not JS-only filters */}
        <nav className="cats" aria-label="Browse by specialty">
          <a className={"pill" + (cat === "" ? " active" : "")} href={`${BP}/`}>All <b>{jobs.length}</b></a>
          {cats.map((c) => (
            <a key={c.slug} className={"pill" + (cat === c.slug ? " active" : "")} href={`${BP}/${c.slug}/`}>{c.name} <b>{c.count}</b></a>
          ))}
        </nav>
      </div>

      <div className="result-meta" aria-live="polite">
        {results.length} role{results.length === 1 ? "" : "s"}
        {generatedAt ? ` · refreshed ${new Date(generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC` : ""}
      </div>

      <div className="jobgrid">
        {results.map((j) => (
          <div className="jobrow-wrap" key={j.slug}>
            <button className={"star" + (stars.has(j.slug) ? " on" : "")} aria-label={stars.has(j.slug) ? "Unsave" : "Save"} aria-pressed={stars.has(j.slug)} onClick={() => toggleStar(j.slug)}>★</button>
            <a className={"rowlink" + (visited.has(j.slug) ? " visited" : "")} href={`${BP}/jobs/${j.slug}/`} title={j.title} onClick={() => addVisited(j.slug)}>
              <span className="mark" style={{ background: j.color }} aria-hidden="true">{(j.company[0] || "?").toUpperCase()}</span>
              <span className="jt">{j.title}</span>
              <span className="jc">{j.company}</span>
              <span className="jl">{j.locations[0] || (j.remote ? "Remote" : "—")}{j.locations.length > 1 ? <span className="more">+{j.locations.length - 1}</span> : null}</span>
              <span className={"js" + (j.sal ? "" : " none")}>{j.sal || "—"}</span>
              <span className={"jd" + (j.age === "today" ? " today" : "")}>{j.age}</span>
            </a>
          </div>
        ))}
        {results.length === 0 && (
          <div className="empty">No roles match these filters. Clear a filter or broaden the search.</div>
        )}
      </div>
    </div>
  );
}
