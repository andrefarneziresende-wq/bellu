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

      // Add use_modular_headers! after the first "platform :ios" line
      if (!podfile.includes("use_modular_headers!")) {
        podfile = podfile.replace(
          /(platform :ios.*\n)/,
          `$1use_modular_headers!\n`
        );
        fs.writeFileSync(podfilePath, podfile, "utf-8");
      }

      return cfg;
    },
  ]);
};
