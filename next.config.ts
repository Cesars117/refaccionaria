import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
      allowedOrigins: ['sistem.radiamex.com', 'www.radiamex.com', 'radiamex.com']
    },
  },
};




export default nextConfig;
