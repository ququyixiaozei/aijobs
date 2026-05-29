export const dynamic = "force-static";

const SITE = process.env.SITE_URL || "https://warpjobs.com";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
