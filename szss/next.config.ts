import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  // Stripe webhook potrebuje raw body
  serverExternalPackages: ["stripe"],
};

export default nextConfig;
