const {
  withDangerousMod,
  withEntitlementsPlist,
  withXcodeProject,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const TARGET_NAME = "LockScreenVocabularyWidget";
const WIDGET_SOURCE_DIR = path.join("widgets", TARGET_NAME);
const STORAGE_APP_GROUP_SUFFIX = "lockscreen-vocabulary";

const getBundleIdentifier = (config) => {
  const bundleIdentifier = config.ios?.bundleIdentifier;
  if (!bundleIdentifier) {
    throw new Error("Lock screen vocabulary widget requires expo.ios.bundleIdentifier");
  }
  return bundleIdentifier;
};

const getAppGroupIdentifier = (config) =>
  `group.${getBundleIdentifier(config)}.${STORAGE_APP_GROUP_SUFFIX}`;

const copyTemplateFile = (projectRoot, iosRoot, fileName, replacements) => {
  const sourcePath = path.join(projectRoot, WIDGET_SOURCE_DIR, fileName);
  const targetDir = path.join(iosRoot, TARGET_NAME);
  const targetPath = path.join(targetDir, fileName);
  let contents = fs.readFileSync(sourcePath, "utf8");

  Object.entries(replacements).forEach(([token, value]) => {
    contents = contents.replace(new RegExp(token, "g"), value);
  });

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetPath, contents);
};

const ensureAppGroupEntitlement = (entitlements, appGroupIdentifier) => {
  const key = "com.apple.security.application-groups";
  const groups = Array.isArray(entitlements[key]) ? entitlements[key] : [];
  return {
    ...entitlements,
    [key]: Array.from(new Set([...groups, appGroupIdentifier])),
  };
};

const trimQuotes = (value) =>
  typeof value === "string" ? value.replace(/^"|"$/g, "") : value;

const findNativeTarget = (project, targetName) => {
  const targets = project.pbxNativeTargetSection();
  return Object.entries(targets).find(([key, target]) => {
    if (key.endsWith("_comment")) return false;
    return trimQuotes(target.name) === targetName;
  });
};

const findPbxGroup = (project, groupName) => {
  const groups = project.hash.project.objects.PBXGroup;
  return Object.entries(groups).find(([key, group]) => {
    if (key.endsWith("_comment")) return false;
    return group.name === groupName || group.path === groupName;
  });
};

const getBuildConfigurations = (project, configurationListId) => {
  const configurationList =
    project.hash.project.objects.XCConfigurationList?.[configurationListId];
  const buildConfigurationSection = project.pbxXCBuildConfigurationSection();
  return (configurationList?.buildConfigurations ?? [])
    .map(({ value }) => buildConfigurationSection[value])
    .filter(Boolean);
};

const setWidgetBuildSettings = ({
  project,
  targetUuid,
  bundleIdentifier,
  appGroupIdentifier,
}) => {
  const target = project.pbxNativeTargetSection()[targetUuid];
  const buildConfigurations = getBuildConfigurations(
    project,
    target.buildConfigurationList,
  );

  buildConfigurations.forEach((configuration) => {
    configuration.buildSettings = {
      ...configuration.buildSettings,
      APPLICATION_EXTENSION_API_ONLY: "YES",
      CODE_SIGN_ENTITLEMENTS: `${TARGET_NAME}/${TARGET_NAME}.entitlements`,
      INFOPLIST_FILE: `${TARGET_NAME}/${TARGET_NAME}-Info.plist`,
      IPHONEOS_DEPLOYMENT_TARGET: "16.0",
      PRODUCT_BUNDLE_IDENTIFIER: `${bundleIdentifier}.${TARGET_NAME}`,
      SWIFT_VERSION: "5.0",
      WIDGET_APP_GROUP_IDENTIFIER: appGroupIdentifier,
    };
  });
};

const ensureWidgetSourceInProject = (project, targetUuid) => {
  let groupEntry = findPbxGroup(project, TARGET_NAME);
  let groupUuid = groupEntry?.[0];

  if (!groupUuid) {
    const group = project.addPbxGroup([], TARGET_NAME, TARGET_NAME);
    groupUuid = group.uuid;

    const { firstProject } = project.getFirstProject();
    const mainGroup = project.getPBXGroupByKey(firstProject.mainGroup);
    const alreadyLinked = mainGroup.children?.some(
      (child) => child.comment === TARGET_NAME,
    );
    if (!alreadyLinked) {
      mainGroup.children.push({ value: groupUuid, comment: TARGET_NAME });
    }
  }

  const sourceFilePath = `${TARGET_NAME}/${TARGET_NAME}.swift`;
  if (!project.hasFile(sourceFilePath)) {
    project.addSourceFile(sourceFilePath, { target: targetUuid }, groupUuid);
  }

  [`${TARGET_NAME}-Info.plist`, `${TARGET_NAME}.entitlements`].forEach(
    (fileName) => {
      const filePath = `${TARGET_NAME}/${fileName}`;
      if (!project.hasFile(filePath)) {
        project.addFile(filePath, groupUuid);
      }
    },
  );
};

const withLockScreenVocabularyWidget = (config) => {
  const appGroupIdentifier = getAppGroupIdentifier(config);
  const bundleIdentifier = getBundleIdentifier(config);

  config = withEntitlementsPlist(config, (modConfig) => {
    modConfig.modResults = ensureAppGroupEntitlement(
      modConfig.modResults,
      appGroupIdentifier,
    );
    return modConfig;
  });

  config = withDangerousMod(config, [
    "ios",
    (modConfig) => {
      const iosRoot = modConfig.modRequest.platformProjectRoot;
      const replacements = {
        "__APP_GROUP_IDENTIFIER__": appGroupIdentifier,
      };

      copyTemplateFile(
        modConfig.modRequest.projectRoot,
        iosRoot,
        `${TARGET_NAME}.swift`,
        replacements,
      );
      copyTemplateFile(
        modConfig.modRequest.projectRoot,
        iosRoot,
        `${TARGET_NAME}-Info.plist`,
        replacements,
      );
      copyTemplateFile(
        modConfig.modRequest.projectRoot,
        iosRoot,
        `${TARGET_NAME}.entitlements`,
        replacements,
      );

      return modConfig;
    },
  ]);

  config = withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults;
    const existingTarget = findNativeTarget(project, TARGET_NAME);
    const targetUuid =
      existingTarget?.[0] ??
      project.addTarget(
        TARGET_NAME,
        "app_extension",
        TARGET_NAME,
        `${bundleIdentifier}.${TARGET_NAME}`,
      ).uuid;

    setWidgetBuildSettings({
      project,
      targetUuid,
      bundleIdentifier,
      appGroupIdentifier,
    });
    ensureWidgetSourceInProject(project, targetUuid);

    return modConfig;
  });

  return config;
};

module.exports = withLockScreenVocabularyWidget;
module.exports.getAppGroupIdentifier = getAppGroupIdentifier;
module.exports.ensureAppGroupEntitlement = ensureAppGroupEntitlement;
