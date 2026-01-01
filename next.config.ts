import type { NextConfig } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import dayjs from 'dayjs';

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
);

const buildDate = dayjs().format('YYYY-MM-DD');

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/connected-papers',
  assetPrefix: '/connected-papers',
  env: {
    NEXT_PUBLIC_VERSION: packageJson.version,
    NEXT_PUBLIC_BUILD_DATE: buildDate,
  },
};

export default nextConfig;
