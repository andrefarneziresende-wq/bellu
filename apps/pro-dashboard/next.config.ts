import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@beauty/shared-types',
    '@beauty/shared-validators',
    '@beauty/shared-utils',
    '@beauty/shared-i18n',
  ],
};

export default nextConfig;
