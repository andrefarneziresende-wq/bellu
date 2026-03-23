import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@beauty/shared-i18n'],
};

export default nextConfig;
