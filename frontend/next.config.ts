import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  ...(process.env.STATIC_EXPORT === "true" ? { output: "export", trailingSlash: true } : {}),
};

export default nextConfig;
