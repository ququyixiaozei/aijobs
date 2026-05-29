import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kebab, isRemote, locShort, regionOf, parseSalary, hasVisa, companyColor, timeAgo, deriveLevel,
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

test("timeAgo buckets (now injectable for determinism)", () => {
  const now = 1_700_000_000_000;
  assert.equal(timeAgo(now, now), "today");
  assert.equal(timeAgo(now - 86400000, now), "1d");
  assert.equal(timeAgo(now - 5 * 86400000, now), "5d");
  assert.equal(timeAgo(now - 60 * 86400000, now), "2mo");
  assert.equal(timeAgo(0, now), "");
});
