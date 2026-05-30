// Safe JSON-LD serialization (SECURITY BOUNDARY).
// JSON.stringify does NOT escape "<" or "/", so any string embedded in a
// <script type="application/ld+json"> block that contains "</script>" would
// terminate the script element and allow arbitrary inline script execution —
// a stored XSS via ANY field, including third-party ATS values we do not fully
// sanitize (e.g. a job title or url). The meta CSP uses 'unsafe-inline' (no
// server for nonces on static hosting), so it cannot stop such an inline
// script — output escaping here is the actual control.
//
// Escaping "<" is the fix (kills "</script>" breakout); ">" and "&" are escaped
// too for defense in depth. The result stays VALID JSON (< is a valid JSON
// escape, so JSON.parse round-trips and crawlers read the structured data fine).
// U+2028/U+2029 are intentionally NOT escaped: they matter only when JSON is
// eval'd as a JS literal (JSONP), not when parsed as JSON-LD. Always use ld() —
// never raw JSON.stringify — for any dangerouslySetInnerHTML JSON-LD sink.
export function ld(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
