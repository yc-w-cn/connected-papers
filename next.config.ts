import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/nextjs-shadcn-template',
  assetPrefix: '/nextjs-shadcn-template',
};

export default nextConfig;
