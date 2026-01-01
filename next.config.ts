import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/connected-papers',
  assetPrefix: '/connected-papers',
};

export default nextConfig;
