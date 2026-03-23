const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch shared packages so Metro can resolve them
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/shared-i18n'),
  path.resolve(monorepoRoot, 'packages/shared-types'),
  path.resolve(monorepoRoot, 'packages/shared-utils'),
];

// Resolve modules from local node_modules first, then root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Map shared @beauty packages
config.resolver.extraNodeModules = {
  '@beauty/shared-i18n': path.resolve(monorepoRoot, 'packages/shared-i18n'),
  '@beauty/shared-types': path.resolve(monorepoRoot, 'packages/shared-types'),
  '@beauty/shared-utils': path.resolve(monorepoRoot, 'packages/shared-utils'),
};

module.exports = config;
