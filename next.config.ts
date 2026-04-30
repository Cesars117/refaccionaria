import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  serverActions: {
    bodySizeLimit: '20mb',
    allowedOrigins: ['*.radiamex.com', 'radiamex.com', 'localhost:3000']
  },
};




export default nextConfig;
