import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages target: static HTML export. Authenticated data operations
  // will be handled by Supabase, outside the Next.js rendering runtime.
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  poweredByHeader: false,
  reactStrictMode: true
};

export default nextConfig;
