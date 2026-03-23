import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@beauty/shared-i18n'],
  webpack: (config) => {
    const localNodeModules = path.resolve(__dirname, 'node_modules');
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(localNodeModules, 'react'),
      'react-dom': path.resolve(localNodeModules, 'react-dom'),
    };
    return config;
  },
};

export default nextConfig;
