const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Only watch specific shared packages, not the entire monorepo
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/shared-i18n'),
  path.resolve(monorepoRoot, 'packages/shared-types'),
  path.resolve(monorepoRoot, 'packages/shared-utils'),
];

// Resolve from both local and root node_modules (local first for correct versions)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Explicitly map packages to ensure correct versions are used.
// Mobile-client needs react@18 + react-native@0.76 while root has react@19.
// If a local copy exists, use it; otherwise fall back to root.
function resolveLocal(pkg) {
  const local = path.resolve(projectRoot, 'node_modules', pkg);
  if (fs.existsSync(local)) return local;
  return path.resolve(monorepoRoot, 'node_modules', pkg);
}

config.resolver.extraNodeModules = {
  '@beauty/shared-i18n': path.resolve(monorepoRoot, 'packages/shared-i18n'),
  '@beauty/shared-types': path.resolve(monorepoRoot, 'packages/shared-types'),
  '@beauty/shared-utils': path.resolve(monorepoRoot, 'packages/shared-utils'),
  'react': resolveLocal('react'),
  'react-dom': resolveLocal('react-dom'),
  'react-native': resolveLocal('react-native'),
  'react-native-screens': resolveLocal('react-native-screens'),
  'react-native-safe-area-context': resolveLocal('react-native-safe-area-context'),
  'scheduler': resolveLocal('scheduler'),
};

module.exports = config;
