const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

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

// Find react 18 — check local first, then root
function findPackage(name, requiredMajor) {
  const paths = [
    path.resolve(projectRoot, 'node_modules', name),
    path.resolve(monorepoRoot, 'node_modules', name),
  ];
  for (const p of paths) {
    try {
      if (!fs.existsSync(p)) continue;
      const pkg = JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf8'));
      console.log(`[Metro] Found ${name}@${pkg.version} at ${p}`);
      if (requiredMajor && !pkg.version.startsWith(requiredMajor + '.')) {
        console.log(`[Metro] Skipping — need major ${requiredMajor}`);
        continue;
      }
      return p;
    } catch {}
  }
  console.log(`[Metro] WARNING: ${name} (major ${requiredMajor}) not found!`);
  return undefined;
}

const react18 = findPackage('react', '18');
const reactDom18 = findPackage('react-dom', '18');
const reactNative = findPackage('react-native', '0');

// Force expo-modules-core to use local v1.x (root has v2.x with src/index.ts only)
const localExpoModulesCore = path.resolve(projectRoot, 'node_modules', 'expo-modules-core');
const hasLocalEMC = fs.existsSync(localExpoModulesCore);
if (hasLocalEMC) {
  console.log(`[Metro] Using local expo-modules-core at ${localExpoModulesCore}`);
}

// Map shared @beauty packages + force react 18 + force local expo-modules-core
config.resolver.extraNodeModules = {
  '@beauty/shared-i18n': path.resolve(monorepoRoot, 'packages/shared-i18n'),
  '@beauty/shared-types': path.resolve(monorepoRoot, 'packages/shared-types'),
  '@beauty/shared-utils': path.resolve(monorepoRoot, 'packages/shared-utils'),
  ...(react18 && { 'react': react18 }),
  ...(reactDom18 && { 'react-dom': reactDom18 }),
  ...(reactNative && { 'react-native': reactNative }),
  ...(hasLocalEMC && { 'expo-modules-core': localExpoModulesCore }),
};

// Block root's react if it's NOT react 18
const rootNM = path.resolve(monorepoRoot, 'node_modules');
const blockPatterns = [];

function shouldBlockRoot(pkg) {
  const rootPkgPath = path.resolve(rootNM, pkg, 'package.json');
  try {
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
    if (!rootPkg.version.startsWith('18.')) {
      console.log(`[Metro] Blocking root ${pkg}@${rootPkg.version} (need v18)`);
      const escaped = path.resolve(rootNM, pkg).replace(/[/\\]/g, '[/\\\\]');
      blockPatterns.push(new RegExp('^' + escaped + '[/\\\\].*'));
    }
  } catch {}
}

shouldBlockRoot('react');
shouldBlockRoot('react-dom');

// Block root expo-modules-core (v2.x src/index.ts) — use local v1.x instead
if (hasLocalEMC) {
  const rootEMC = path.resolve(rootNM, 'expo-modules-core').replace(/[/\\]/g, '[/\\\\]');
  blockPatterns.push(new RegExp('^' + rootEMC + '[/\\\\].*'));
  console.log('[Metro] Blocking root expo-modules-core (using local)');
}

if (blockPatterns.length > 0) {
  config.resolver.blockList = blockPatterns;
}

module.exports = config;
