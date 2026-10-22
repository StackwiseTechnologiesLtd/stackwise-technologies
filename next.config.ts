import path from "node:path";
import type { NextConfig } from "next";

const workerBuild = process.env.OPENNEXT_CLOUDFLARE_BUILD === "1";
const playwrightStub = path.join(
  process.cwd(),
  "src/lib/growth/stubs/playwright-stub.ts",
);

const nextConfig: NextConfig = {
  ...(workerBuild
    ? {
        outputFileTracingExcludes: {
          "*": [
            "./node_modules/playwright/**",
            "./node_modules/playwright-core/**",
            "./node_modules/chromium-bidi/**",
          ],
        },
        webpack: (config, { isServer }) => {
          if (isServer) {
            config.resolve ??= {};
            config.resolve.alias ??= {};
            config.resolve.alias.playwright = playwrightStub;
          }
          return config;
        },
      }
    : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.gravatar.com",
        pathname: "/avatar/**",
      },
    ],
  },
};

export default nextConfig;
