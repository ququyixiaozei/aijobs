"use client";
import { useState, useMemo, useEffect, useRef } from "react";

const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";
const REGIONS = ["US", "EU", "UK", "Remote", "APAC"];
const SAL_STEPS = [0, 200, 300, 400];
const LEVELS = [["senior", "senior"], ["staff", "staff+"], ["manager", "manager"]];
const RECENCY = [[0, "any time"], [7, "≤7d"], [30, "≤30d"]];
const DAY = 86400000;

// Keep the default (recency) view from letting one company blanket the first screen:
// preserve near-recency order but never allow >2 consecutive rows from one company.
function spreadByCompany(sorted, maxRun = 2) {
  const out = [];
  const pending = sorted.slice();
  while (pending.length) {
    let idx = 0;
    if (out.length >= maxRun && out[out.length - 1].company === out[out.length - maxRun].company) {
      const alt = pending.findIndex((j) => j.company !== out[out.length - 1].company);
      if (alt >= 0) idx = alt;
    }
    out.push(pending.splice(idx, 1)[0]);
  }
  return out;
}

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
  const [levels, setLevels] = useState(() => new Set());
  const [recencyDays, setRecencyDays] = useState(0);
  const [sort, setSort] = useState("new");
  const [starredOnly, setStarredOnly] = useState(false);
  const [showNoSal, setShowNoSal] = useState(false); // when a salary floor is set, re-include undisclosed-salary roles
  const [density, setDensity] = useState("compact"); // B-22: dense by default (heavy scanners)
  const [stars, toggleStar] = useLocalSet("aijobs:stars");
  const [visited, , addVisited] = useLocalSet("aijobs:visited");
  const inputRef = useRef(null);
  const didInit = useRef(false);

  useEffect(() => {
    try { const d = localStorage.getItem("aijobs:density"); if (d) setDensity(d); } catch {}
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get("q")) setQ(p.get("q"));
      if (p.get("region")) setRegions(new Set(p.get("region").split(",").filter(Boolean)));
      if (p.get("level")) setLevels(new Set(p.get("level").split(",").filter(Boolean)));
      if (p.get("visa") === "1") setVisaOnly(true);
      if (p.get("sal")) setMinSal(Number(p.get("sal")) || 0);
      if (p.get("since")) setRecencyDays(Number(p.get("since")) || 0);
      if (["salary", "company"].includes(p.get("sort"))) setSort(p.get("sort"));
      if (p.get("saved") === "1") setStarredOnly(true);
    } catch {}
    didInit.current = true;
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault(); inputRef.current && inputRef.current.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Mirror filter state into the URL (Back restores filters + links are shareable).
  useEffect(() => {
    if (!didInit.current) return;
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (regions.size) p.set("region", [...regions].join(","));
    if (levels.size) p.set("level", [...levels].join(","));
    if (visaOnly) p.set("visa", "1");
    if (minSal) p.set("sal", String(minSal));
    if (recencyDays) p.set("since", String(recencyDays));
    if (sort !== "new") p.set("sort", sort);
    if (starredOnly) p.set("saved", "1");
    const qs = p.toString();
    try { window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "")); } catch {}
  }, [q, regions, levels, visaOnly, minSal, recencyDays, sort, starredOnly]);

  const setDens = (d) => { setDensity(d); try { localStorage.setItem("aijobs:density", d); } catch {} };
  const toggleRegion = (r) => setRegions((p) => { const n = new Set(p); n.has(r) ? n.delete(r) : n.add(r); return n; });
  const toggleLevel = (l) => setLevels((p) => { const n = new Set(p); n.has(l) ? n.delete(l) : n.add(l); return n; });
  const anyFilter = q || regions.size || visaOnly || minSal || levels.size || recencyDays || starredOnly;
  const clearAll = () => { setQ(""); setRegions(new Set()); setVisaOnly(false); setMinSal(0); setLevels(new Set()); setRecencyDays(0); setStarredOnly(false); setShowNoSal(false); };

  const { results, noSal } = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    let noSalCount = 0;
    const r = jobs.filter((j) => {
      if (cat && !(j.cats || []).includes(cat)) return false;
      if (regions.size && !regions.has(j.region)) return false;
      if (visaOnly && !j.visa) return false;
      if (levels.size && !levels.has(j.level)) return false;
      if (recencyDays && !(j.ts && Date.now() - j.ts <= recencyDays * DAY)) return false;
      if (starredOnly && !stars.has(j.slug)) return false;
      if (tokens.length) {
        // tech-stack tags (derived from the description) join the haystack so "triton"/"rust"
        // hits a generically-titled role whose body is that work.
        const hay = (j.title + " " + j.company + " " + (j.locations || []).join(" ") + " " + (j.tags || []).join(" ")).toLowerCase();
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      // Salary floor: a broad placeholder ($100K–$500K) never satisfies a floor; an
      // undisclosed band is counted and hidden by default, restorable via the toggle —
      // so a $200K+ filter doesn't silently drop OpenAI/Anthropic roles that posted no number.
      if (minSal) {
        if (j.salBroad) return false;
        if (!j.salMin) { noSalCount++; if (!showNoSal) return false; }
        else if (j.salMin < minSal) return false;
      }
      return true;
    });
    const sorted = sort === "new"
      ? spreadByCompany([...r].sort((a, b) => b.ts - a.ts))
      : [...r].sort({
          company: (a, b) => a.company.localeCompare(b.company) || b.ts - a.ts,
          // broad placeholder ranges (salBroad) sort to the bottom, never above real bands
          salary: (a, b) => (a.salBroad ? 1 : 0) - (b.salBroad ? 1 : 0) || (b.salMin || 0) - (a.salMin || 0) || b.ts - a.ts,
        }[sort]);
    return { results: sorted, noSal: noSalCount };
  }, [jobs, q, cat, regions, visaOnly, minSal, levels, recencyDays, starredOnly, stars, sort, showNoSal]);

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
          {LEVELS.map(([v, label]) => (
            <button key={v} className={"chip" + (levels.has(v) ? " active" : "")} aria-pressed={levels.has(v)} onClick={() => toggleLevel(v)}>{label}</button>
          ))}
          <span className="sep" />
          {RECENCY.map(([d, label]) => (
            <button key={d} className={"chip" + (recencyDays === d ? " active" : "")} onClick={() => setRecencyDays(d)}>{label}</button>
          ))}
          <span className="sep" />
          <button className={"chip" + (starredOnly ? " active" : "")} aria-pressed={starredOnly} onClick={() => setStarredOnly((v) => !v)}>★ saved{stars.size ? ` ${stars.size}` : ""}</button>
          {anyFilter ? <button className="chip clear" onClick={clearAll}>✕ clear</button> : null}
        </div>

        {/* View group */}
        <div className="group view">
          <span className="glabel">view</span>
          {["new", "salary", "company"].map((s) => (
            <button key={s} className={"chip" + (sort === s ? " active" : "")} aria-pressed={sort === s} onClick={() => setSort(s)}>{s === "new" ? "newest" : s}</button>
          ))}
          <span className="sep" />
          <button className={"chip" + (density === "compact" ? " active" : "")} aria-pressed={density === "compact"} onClick={() => setDens("compact")}>compact</button>
          <button className={"chip" + (density === "comfortable" ? " active" : "")} aria-pressed={density === "comfortable"} onClick={() => setDens("comfortable")}>comfortable</button>
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
        {minSal && noSal ? (
          <>
            {" · "}{showNoSal ? `incl. ${noSal} with no listed salary` : `${noSal} with no listed salary hidden`}{" "}
            <button className="metalink" onClick={() => setShowNoSal((v) => !v)} aria-pressed={showNoSal}>{showNoSal ? "hide" : "show"}</button>
          </>
        ) : null}
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
              <span className={"js" + (j.sal ? "" : " none") + (j.salBroad ? " broad" : "")} title={j.salBroad ? "Broad posted range — excluded from salary sort/filter" : undefined}>{j.sal || "—"}{j.salBroad ? <span className="bcaret">~</span> : null}</span>
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
