import type { NextConfig } from "next";

const nextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  serverActions: {
    bodySizeLimit: "20mb",
  },
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
} as unknown as NextConfig;

export default nextConfig;
