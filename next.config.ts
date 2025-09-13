import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'mongoose'];
    }
    return config;
  },
  typescript:{
    ignoreBuildErrors:true
  },
  eslint:{
    ignoreDuringBuilds:true
  },
  images:{
    remotePatterns:[
      {
        hostname:"rasterweb.net",
        protocol:"https",
        port:""
      },
      {
        hostname:"**",
        protocol:"https",
        port:""
      },
      {
        hostname:"images.piclumen.com",
        protocol:"https",
        port:""
      },
      {
        hostname:"lh3.googleusercontent.com",
        protocol:"https",
        port:""
      },
    ]
  }
};

export default nextConfig;
