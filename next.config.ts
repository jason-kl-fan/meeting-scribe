import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  ...(isGithubPages
    ? {
        output: "export",
        trailingSlash: true,
        basePath: "/meeting-scribe",
        assetPrefix: "/meeting-scribe/",
      }
    : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
