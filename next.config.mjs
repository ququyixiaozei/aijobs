/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // static HTML export → deployable on any static host (GitHub Pages / Cloudflare / Vercel)
  images: { unoptimized: true },
  trailingSlash: true, // nicer static paths (/jobs/x/ → index.html) for plain static hosting
  // '/aijobs' for the github.io project-page preview; set NEXT_PUBLIC_BASE_PATH='' (or unset) for a custom domain at root
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};
export default nextConfig;
