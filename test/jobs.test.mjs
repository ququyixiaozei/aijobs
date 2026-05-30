import { test } from "node:test";
import assert from "node:assert/strict";
import {
  statsFor, isIndexableCompany, isIndexableSlice, robotsFor,
  MIN_INDEX_COMPANY, MIN_INDEX_SLICE,
} from "../lib/jobs.js";

// browser-shaped job factory (matches getBrowserJobs() output that statsFor consumes)
const J = (o) => ({ company: "X", cats: [], salMin: 0, salMax: 0, remote: false, visa: false, level: "", ...o });

test("index thresholds are the single source of truth (sitemap + robots agree)", () => {
  assert.equal(isIndexableCompany(MIN_INDEX_COMPANY - 1), false);
  assert.equal(isIndexableCompany(MIN_INDEX_COMPANY), true);
  assert.equal(isIndexableSlice(MIN_INDEX_SLICE - 1), false);
  assert.equal(isIndexableSlice(MIN_INDEX_SLICE), true);
});

test("robotsFor: indexable → default (undefined); thin → noindex,follow", () => {
  assert.equal(robotsFor(true), undefined);
  assert.deepEqual(robotsFor(false), { index: false, follow: true });
});

test("statsFor on empty set is safe (no Infinity salary band)", () => {
  const s = statsFor([]);
  assert.equal(s.total, 0);
  assert.equal(s.companies, 0);
  assert.equal(s.salLo, 0);
  assert.equal(s.salHi, 0);
  assert.deepEqual(s.byCat, []);
  assert.deepEqual(s.topCompanies, []);
});

test("statsFor aggregates companies, salary band, facets and levels", () => {
  const jobs = [
    J({ company: "Anthropic", cats: ["inference-jobs"], salMin: 200, salMax: 320, visa: true, level: "senior" }),
    J({ company: "Anthropic", cats: ["ml-systems-jobs"], level: "staff" }),
    J({ company: "Graphcore", cats: ["performance-engineering-jobs", "gpu-jobs"], salMin: 120, salMax: 180, remote: true, level: "senior" }),
  ];
  const s = statsFor(jobs);
  assert.equal(s.total, 3);
  assert.equal(s.companies, 2);
  assert.equal(s.salCount, 2);
  assert.equal(s.salLo, 120); // min across disclosed
  assert.equal(s.salHi, 320); // max across disclosed
  assert.equal(s.remote, 1);
  assert.equal(s.visa, 1);
  assert.equal(s.topCompanies[0].name, "Anthropic"); // 2 roles ranks above Graphcore's 1
  assert.equal(s.topCompanies[0].n, 2);
  assert.equal(s.topCompanies[0].slug, "anthropic");
  assert.equal(s.level.senior, 2);
  assert.equal(s.level.staff, 1);
  assert.deepEqual(
    s.byCat.map((c) => c.slug).sort(),
    ["gpu-jobs", "inference-jobs", "ml-systems-jobs", "performance-engineering-jobs"]
  );
});

test("statsFor salary band falls back to salMin when salMax missing", () => {
  const s = statsFor([J({ salMin: 150, salMax: 0 })]);
  assert.equal(s.salLo, 150);
  assert.equal(s.salHi, 150);
});
