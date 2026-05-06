const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const TOKEN_FILE_NAME = "adi-registration.properties";

const copyAdiRegistrationFile = (projectRoot, platformProjectRoot) => {
  const sourcePath = path.join(projectRoot, "assets", TOKEN_FILE_NAME);
  const targetDir = path.join(platformProjectRoot, "app", "src", "main", "assets");
  const targetPath = path.join(targetDir, TOKEN_FILE_NAME);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing Android developer verification token: ${sourcePath}`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
};

const withAdiRegistration = (config) =>
  withDangerousMod(config, [
    "android",
    (modConfig) => {
      copyAdiRegistrationFile(
        modConfig.modRequest.projectRoot,
        modConfig.modRequest.platformProjectRoot,
      );

      return modConfig;
    },
  ]);

module.exports = withAdiRegistration;
module.exports.copyAdiRegistrationFile = copyAdiRegistrationFile;
