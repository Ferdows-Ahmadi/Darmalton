import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Verification builds use a separate directory so a running `next dev`
  // process never observes production artifacts in its own `.next` cache.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
      { protocol: "http", hostname: "backend", port: "8000" }
    ]
  }
};

export default nextConfig;
