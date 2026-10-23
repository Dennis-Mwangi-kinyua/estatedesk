const { withAppBuildGradle } = require("expo/config-plugins");

// Prebuild otherwise signs release builds with the public Android debug key.
module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (result) => {
    if (result.modResults.language !== "groovy") throw new Error("Release signing requires a Groovy app build.gradle.");
    let source = result.modResults.contents;
    if (!source.includes("signingConfig signingConfigs.release")) {
      const releaseBlock = /release \{\s*\/\/ Caution![\s\S]*?signingConfig signingConfigs\.debug/;
      if (!releaseBlock.test(source)) throw new Error("Cannot safely configure Android release signing: unexpected build template.");
      source = source.replace(releaseBlock, "release {\n            signingConfig signingConfigs.release");
      source = source.replace("    signingConfigs {", `    signingConfigs {
        release {
            // EAS injects managed credentials. Local builds require explicit upload credentials.
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword findProperty('MYAPP_UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('MYAPP_UPLOAD_KEY_ALIAS')
                keyPassword findProperty('MYAPP_UPLOAD_KEY_PASSWORD')
            }
        }`);
    }
    result.modResults.contents = source;
    return result;
  });
};
