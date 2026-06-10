import { getAllJobs, getMeta } from "../../lib/jobs.js";
import { countryOf } from "../../lib/derive.js";

export const dynamic = "force-static";

const SITE = process.env.SITE_URL || "https://example.com";

// Job-aggregator submission feed (Jooble/Talent/WhatJobs etc. all accept the
// Indeed-style <source><job> XML). <url> points at OUR leaf page so accepted
// sources send their click traffic to warpjobs, not straight to the ATS.
// CDATA-wrapped; "]]>" inside content is split so it can't break out.
const cdata = (s) => `<![CDATA[${String(s).replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;

function rfc822(iso) {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d) ? d.toUTCString() : "";
}

export function GET() {
  const jobs = getAllJobs();
  const items = jobs
    .map((j) => {
      const city = j.locShort && j.locShort !== "Remote" ? j.locShort : "";
      const country = countryOf(j.location) || "";
      return (
        `<job>` +
        `<title>${cdata(j.title)}</title>` +
        `<date>${cdata(rfc822(j.postedAt))}</date>` +
        `<referencenumber>${cdata(j.sourceId)}</referencenumber>` +
        `<url>${cdata(`${SITE}/jobs/${j.slug}/`)}</url>` +
        `<company>${cdata(j.company)}</company>` +
        `<city>${cdata(city)}</city>` +
        `<state>${cdata("")}</state>` +
        `<country>${cdata(country)}</country>` +
        `<description>${cdata(j.descriptionHtml || `${j.title} at ${j.company}.`)}</description>` +
        (j.salText && !j.salBroad ? `<salary>${cdata(j.salText)}</salary>` : "") +
        `<jobtype>${cdata("fulltime")}</jobtype>` +
        `<remote>${cdata(j.remote ? "yes" : "no")}</remote>` +
        `</job>`
      );
    })
    .join("");
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<source>` +
    `<publisher>WarpJobs</publisher>` +
    `<publisherurl>${SITE}</publisherurl>` +
    `<lastBuildDate>${rfc822(getMeta().generatedAt) || new Date().toUTCString()}</lastBuildDate>` +
    items +
    `</source>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
