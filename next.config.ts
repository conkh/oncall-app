import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS || false;

let repoName = "";
if (isGithubActions && process.env.GITHUB_REPOSITORY) {
  repoName = process.env.GITHUB_REPOSITORY.replace(/.*?\//, "");
}

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubActions ? `/${repoName}` : "",
  assetPrefix: isGithubActions ? `/${repoName}/` : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
