import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pin the project root (a stray lockfile in the home folder otherwise confuses Turbopack)
  turbopack: { root: process.cwd() },
  images: {
    formats: ["image/avif", "image/webp"],
    // the gallery renders at q=85, everything else at the default 75
    qualities: [75, 85],
  },
};

export default nextConfig;
