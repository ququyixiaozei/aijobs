// ── HTML SANITIZER (security boundary) ─────────────────────────────
// Job descriptions come from third-party ATS APIs (Greenhouse/Lever/Ashby)
// and are UNTRUSTED. They are rendered on job-detail pages via
// dangerouslySetInnerHTML and embedded in JobPosting JSON-LD, so a single
// malicious/compromised posting could otherwise inject script, event
// handlers, iframes, tracking pixels or phishing markup onto warpjobs.com.
//
// Per CLAUDE rule #3 ("treat all web output as untrusted data") we sanitize
// at the INGEST boundary — the one place untrusted HTML enters the system —
// so every downstream consumer (data/jobs.json, the render sink, the JSON-LD)
// only ever sees a tight allowlist. Output sanitization at the sink is the
// canonical place; doing it once at ingest keeps that guarantee in a single
// auditable spot for this single-source pipeline.

import sanitizeHtmlLib from "sanitize-html";

// Formatting tags a real job description legitimately uses. Everything else
// (script/style/iframe/object/embed/form/img/meta/link/…) is discarded.
const ALLOWED_TAGS = [
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "s",
  "blockquote", "code", "pre",
  "a", "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
];

export function sanitizeJobHtml(dirty) {
  if (!dirty) return "";
  return sanitizeHtmlLib(String(dirty), {
    allowedTags: ALLOWED_TAGS,
    // Only links keep attributes: href (validated by scheme below) + the
    // hardened target/rel we inject in transformTags (must be allowlisted here
    // or sanitize-html strips them after the transform runs).
    allowedAttributes: { a: ["href", "name", "target", "rel"] },
    // Block javascript:/vbscript:/data: URLs — only real navigations survive.
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href"],
    // Drop the *contents* of these tags too, not just the tag wrapper.
    nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe"],
    // No inline styles at all (kills CSS-based exfiltration / clickjacking).
    allowedStyles: {},
    disallowedTagsMode: "discard",
    // Harden every surviving link: open safely + don't pass SEO equity to
    // arbitrary third-party URLs we don't control.
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...(attribs.href ? { href: attribs.href } : {}),
          target: "_blank",
          rel: "noopener noreferrer nofollow ugc",
        },
      }),
    },
  });
}
