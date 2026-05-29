// Security regression tests for the ingest HTML sanitizer.
// These guard the XSS boundary: if someone loosens the allowlist and
// reintroduces a script/handler/iframe vector, the CI test gate blocks deploy.
import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeJobHtml } from "../ingest/sanitize.mjs";

test("strips <script> tag and its contents", () => {
  const out = sanitizeJobHtml("<p>Hi</p><script>steal(document.cookie)</script>");
  assert.ok(out.includes("<p>Hi</p>"));
  assert.ok(!/script/i.test(out));
  assert.ok(!out.includes("steal"));
});

test("strips event-handler attributes and non-allowlisted <img>", () => {
  const out = sanitizeJobHtml('<img src=x onerror="alert(1)"><a href="#" onclick="evil()">x</a>');
  assert.ok(!/onerror/i.test(out));
  assert.ok(!/onclick/i.test(out));
  assert.ok(!/<img/i.test(out));
});

test("removes javascript: URLs, keeps safe https links, hardens rel", () => {
  const out = sanitizeJobHtml('<a href="javascript:alert(1)">x</a><a href="https://ok.com">ok</a>');
  assert.ok(!/javascript:/i.test(out));
  assert.ok(out.includes("https://ok.com"));
  assert.ok(/rel="[^"]*nofollow/i.test(out));
  assert.ok(/rel="[^"]*noopener/i.test(out));
});

test("drops iframe/style and inline style attributes", () => {
  const out = sanitizeJobHtml('<iframe src="//evil"></iframe><div style="position:fixed;top:0">x</div><style>body{display:none}</style>');
  assert.ok(!/iframe/i.test(out));
  assert.ok(!/style=/i.test(out));
  assert.ok(!out.includes("display:none"));
});

test("keeps legitimate formatting tags", () => {
  const out = sanitizeJobHtml("<h3>Role</h3><ul><li>Build <strong>kernels</strong></li></ul>");
  assert.ok(out.includes("<h3>"));
  assert.ok(out.includes("<li>"));
  assert.ok(out.includes("<strong>"));
});

test("nullish / empty input returns empty string", () => {
  assert.equal(sanitizeJobHtml(""), "");
  assert.equal(sanitizeJobHtml(undefined), "");
  assert.equal(sanitizeJobHtml(null), "");
});
