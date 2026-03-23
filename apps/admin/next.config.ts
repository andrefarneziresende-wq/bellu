import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@beauty/shared-types',
    '@beauty/shared-validators',
    '@beauty/shared-utils',
    '@beauty/shared-i18n',
  ],
  webpack: (config) => {
    // Force react/react-dom to resolve from admin's own node_modules (react 19)
    // instead of the hoisted root node_modules (react 18 for mobile-client)
    const adminNodeModules = path.resolve(__dirname, 'node_modules');
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(adminNodeModules, 'react'),
      'react-dom': path.resolve(adminNodeModules, 'react-dom'),
    };
    return config;
  },
};

export default nextConfig;
