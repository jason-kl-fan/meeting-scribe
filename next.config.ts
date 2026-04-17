import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS || process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isGithubPages ? "/meeting-scribe" : "",
  assetPrefix: isGithubPages ? "/meeting-scribe/" : undefined,
};

export default nextConfig;
