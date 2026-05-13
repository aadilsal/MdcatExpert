import type { NextConfig } from "next";

const nextConfig = {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  serverActions: {
    bodySizeLimit: "20mb",
  },
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
} as unknown as NextConfig;

export default nextConfig;
