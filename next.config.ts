import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async redirects() {
    return [];
  },
};

export default config;
