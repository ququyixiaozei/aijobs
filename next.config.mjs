/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // static HTML export → deployable on any static host (GitHub Pages / Cloudflare / Vercel)
  images: { unoptimized: true },
  trailingSlash: true, // nicer static paths (/jobs/x/ → index.html) for plain static hosting
};
export default nextConfig;
