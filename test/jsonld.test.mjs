// Security regression test: JSON-LD serialization must not allow a payload in
// any field to break out of the <script> element. Guards the XSS fix in the CI
// gate — if someone reverts ld() to raw JSON.stringify, the build fails.
import test from "node:test";
import assert from "node:assert/strict";
import { ld } from "../lib/jsonld.js";

test("ld() escapes < so a malicious title cannot close the script tag", () => {
  const out = ld({ title: "GPU Engineer </script><script>alert(document.domain)</script>" });
  assert.ok(!out.includes("</script>"), "must not contain a literal </script>");
  assert.ok(!/<script/i.test(out), "must not contain a literal <script");
  assert.ok(out.includes("\\u003c"), "< should be unicode-escaped");
});

test("ld() escapes > and &", () => {
  const out = ld({ a: "1 < 2 > 0 & true" });
  assert.ok(!/[<>]/.test(out));
  assert.ok(out.includes("\\u003c") && out.includes("\\u003e") && out.includes("\\u0026"));
});

test("ld() output is still valid JSON (crawlers parse it; < round-trips back)", () => {
  const obj = { "@type": "JobPosting", title: "A </script> B", url: "https://x.test/a&b", n: 5 };
  assert.deepEqual(JSON.parse(ld(obj)), obj);
});
