import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/playwright/**",
      "./node_modules/playwright-core/**",
      "./node_modules/chromium-bidi/**",
    ],
  },
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
