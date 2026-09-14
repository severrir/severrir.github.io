import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages (no Node server at runtime).
  output: "export",
  // Emit /services/index.html rather than /services.html so extension-less
  // URLs resolve on Pages.
  trailingSlash: true,
  images: {
    // The Next image optimizer needs a server; static export serves as-is.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
};

export default nextConfig;
