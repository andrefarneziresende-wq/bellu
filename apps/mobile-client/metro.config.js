const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Only watch specific shared packages, not the entire monorepo
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/shared-i18n'),
  path.resolve(monorepoRoot, 'packages/shared-types'),
  path.resolve(monorepoRoot, 'packages/shared-utils'),
];

// Resolve from both local and root node_modules (root has many deps like @expo/*)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Map shared @beauty packages explicitly
config.resolver.extraNodeModules = {
  '@beauty/shared-i18n': path.resolve(monorepoRoot, 'packages/shared-i18n'),
  '@beauty/shared-types': path.resolve(monorepoRoot, 'packages/shared-types'),
  '@beauty/shared-utils': path.resolve(monorepoRoot, 'packages/shared-utils'),
};

// Block root-level copies of packages that have incompatible versions.
// Root has react@19, react-native@0.80, react-native-screens@4.24, scheduler@0.23.2
// Mobile-client needs react@18, react-native@0.76, react-native-screens@4.4
const rootNM = path.resolve(monorepoRoot, 'node_modules');
function blockRootPkg(pkgName) {
  const p = path.resolve(rootNM, pkgName).replace(/[/\\]/g, '[/\\\\]');
  return new RegExp('^' + p + '[/\\\\].*');
}

config.resolver.blockList = [
  blockRootPkg('react'),
  blockRootPkg('react-dom'),
  blockRootPkg('react-native'),
  blockRootPkg('react-native-screens'),
  blockRootPkg('react-native-safe-area-context'),
  blockRootPkg('scheduler'),
];

module.exports = config;
