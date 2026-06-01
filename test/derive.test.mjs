import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kebab, isRemote, locShort, regionOf, parseSalary, hasVisa, companyColor, timeAgo, deriveLevel, countryOf,
  postedDateOf, activeDateOf, isBroadSalary, deriveTags,
} from "../lib/derive.js";

test("kebab normalizes punctuation/whitespace (drives dedup keys + slugs)", () => {
  assert.equal(kebab("Senior Engineer - ML Kernels & Runtime"), "senior-engineer-ml-kernels-runtime");
  assert.equal(kebab("Senior Engineer – ML Kernels & Runtime"), "senior-engineer-ml-kernels-runtime"); // en-dash folds same
  assert.equal(kebab("GPU/CUDA"), "gpu-cuda");
});

test("isRemote", () => {
  assert.equal(isRemote("Remote - Europe"), true);
  assert.equal(isRemote("Work from home"), true);
  assert.equal(isRemote("San Francisco, CA"), false);
});

test("locShort takes the primary location", () => {
  assert.equal(locShort("Amsterdam; Remote - Europe; United States"), "Amsterdam");
  assert.equal(locShort("Remote"), "Remote");
  assert.equal(locShort(""), "");
});

test("regionOf buckets", () => {
  assert.equal(regionOf("San Francisco, CA"), "US");
  assert.equal(regionOf("London, United Kingdom"), "UK");
  assert.equal(regionOf("Amsterdam, Netherlands"), "EU");
  assert.equal(regionOf("Tokyo, Japan"), "APAC");
  assert.equal(regionOf("", true), "Remote");
  assert.equal(regionOf("Mars"), "Other");
});

test("regionOf covers Bay Area cities + EU cities that previously fell through to Other", () => {
  // these were live "Other" rows: city without a comma-prefixed state, or a non-listed EU locale
  assert.equal(regionOf("Sunnyvale CA or Toronto Canada"), "US"); // primary loc = Sunnyvale
  assert.equal(regionOf("Santa Clara"), "US");
  assert.equal(regionOf("San Jose"), "US");
  assert.equal(regionOf("Belgrade, Serbia"), "EU");
  assert.equal(regionOf("Zürich, CH"), "EU"); // umlaut form
});

test("regionOf classifies on the PRIMARY segment, not a later one (multi-location)", () => {
  // displayed city is Amsterdam → must bucket EU, not US via a later '; Remote - United States'
  assert.equal(regionOf("Amsterdam, Netherlands; Remote - Europe; Remote - United States"), "EU");
  assert.equal(regionOf("Europe; Remote, California, United States; UAE"), "EU");
  assert.equal(regionOf("Remote; San Francisco, CA"), "US"); // primary 'remote' unclassifiable → fall back to full string
});

test("deriveTags extracts allowlisted tech-stack from the description body", () => {
  const tags = deriveTags("<p>Write CUDA and Triton kernels; experience with vLLM and PyTorch.</p>");
  assert.ok(tags.includes("CUDA") && tags.includes("Triton") && tags.includes("vLLM") && tags.includes("PyTorch"));
  assert.deepEqual(deriveTags("We value teamwork and clear communication."), []); // no false positives
  assert.deepEqual(deriveTags(""), []);
});

test("parseSalary handles K-ranges and full numbers", () => {
  const a = parseSalary("<p>Comp: $165K - $220K</p>");
  assert.deepEqual([a.text, a.min, a.max], ["$165K–$220K", 165, 220]);
  const b = parseSalary("between $350,000 to $850,000 USD");
  assert.equal(b.min, 350);
  assert.equal(b.text, "$350K–$850K");
  assert.equal(parseSalary("competitive salary").min, 0);
});

test("hasVisa", () => {
  assert.equal(hasVisa("We offer visa sponsorship and relocation"), true);
  assert.equal(hasVisa("Join our great team"), false);
});

test("companyColor is deterministic", () => {
  assert.equal(companyColor("Anthropic"), companyColor("Anthropic"));
  assert.ok(companyColor("Anthropic").startsWith("hsl("));
});

test("deriveLevel maps titles (and ignores 'Member of Technical Staff')", () => {
  assert.equal(deriveLevel("Senior Software Engineer"), "senior");
  assert.equal(deriveLevel("Staff Engineer, GPU"), "staff");
  assert.equal(deriveLevel("Principal ML Compiler Engineer"), "staff");
  assert.equal(deriveLevel("Engineering Manager, Inference"), "manager");
  assert.equal(deriveLevel("Member of Technical Staff, Inference"), ""); // not "staff"
  assert.equal(deriveLevel("CUDA Kernel Engineer"), "");
});

test("countryOf maps locations to ISO codes for JobPosting (or '' when unsure)", () => {
  assert.equal(countryOf("San Francisco, CA"), "US");
  assert.equal(countryOf("London, United Kingdom"), "GB");
  assert.equal(countryOf("Paris, France"), "FR");
  assert.equal(countryOf("Amsterdam, Netherlands"), "NL");
  assert.equal(countryOf("Tokyo, Japan"), "JP");
  assert.equal(countryOf("Atlantis"), ""); // no false guess
});

test("countryOf fills the leaf-JobPosting addressCountry gaps that shipped empty", () => {
  assert.equal(countryOf("Seoul"), "KR");
  assert.equal(countryOf("New Taipei City, Taiwan"), "TW");
  assert.equal(countryOf("Belgrade, Serbia"), "RS");
  assert.equal(countryOf("Santa Clara"), "US");
  assert.equal(countryOf("San Jose"), "US");
  assert.equal(countryOf("Istanbul, Turkey"), "TR");
  assert.equal(countryOf("Toronto, ON"), "CA");
  assert.equal(countryOf("North America"), ""); // still genuinely ambiguous → no guess
});

test("postedDateOf uses real first-published; activeDateOf uses the most-recent signal", () => {
  // updatedAt is the bulk-touched ATS field; postedAt is the honest posting date
  const j = { postedAt: "2025-03-14T00:00:00Z", updatedAt: "2026-05-29T00:00:00Z" };
  assert.equal(postedDateOf(j), new Date("2025-03-14T00:00:00Z").getTime()); // NOT the bulk updatedAt
  assert.equal(activeDateOf(j), new Date("2026-05-29T00:00:00Z").getTime()); // freshness keeps active posts
  assert.equal(postedDateOf({}), 0);
  assert.equal(activeDateOf({}), 0);
});

test("isBroadSalary flags placeholder-wide ranges (>=2.3x), keeps real bands", () => {
  assert.equal(isBroadSalary(100, 500), true); // 5.0x — Tenstorrent legal placeholder
  assert.equal(isBroadSalary(280, 850), true); // 3.0x
  assert.equal(isBroadSalary(165, 242), false); // 1.47x — real band
  assert.equal(isBroadSalary(160, 230), false); // 1.44x
  assert.equal(isBroadSalary(0, 500), false); // no floor → not a usable range anyway
  assert.equal(isBroadSalary(200, 0), false);
});

test("timeAgo buckets (now injectable for determinism)", () => {
  const now = 1_700_000_000_000;
  assert.equal(timeAgo(now, now), "today");
  assert.equal(timeAgo(now - 86400000, now), "1d");
  assert.equal(timeAgo(now - 5 * 86400000, now), "5d");
  assert.equal(timeAgo(now - 60 * 86400000, now), "2mo");
  assert.equal(timeAgo(0, now), "");
});
