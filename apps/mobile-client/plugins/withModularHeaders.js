const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const podfilePath = path.join(
        cfg.modRequest.platformProjectRoot,
        "Podfile"
      );
      let podfile = fs.readFileSync(podfilePath, "utf-8");

      // Add modular headers ONLY for Firebase pods (not globally)
      // This avoids "Redefinition of module ReactCommon" error
      const snippet = `
  # Firebase requires modular headers for its Swift pods
  pod 'FirebaseCore', :modular_headers => true
  pod 'FirebaseCoreInternal', :modular_headers => true
  pod 'FirebaseCoreExtension', :modular_headers => true
  pod 'FirebaseInstallations', :modular_headers => true
  pod 'FirebaseMessaging', :modular_headers => true
  pod 'GoogleUtilities', :modular_headers => true
  pod 'GoogleDataTransport', :modular_headers => true
  pod 'nanopb', :modular_headers => true
  pod 'PromisesObjC', :modular_headers => true
`;

      if (!podfile.includes("FirebaseCore', :modular_headers")) {
        // Insert before the first "target" line
        podfile = podfile.replace(
          /(target\s+'[^']+'\s+do)/,
          `${snippet}\n$1`
        );
        fs.writeFileSync(podfilePath, podfile, "utf-8");
      }

      return cfg;
    },
  ]);
};
