import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const toolchainRoot = path.join(workspaceRoot, ".private/toolchains");

export function androidEnvironment(base = process.env) {
  const env = { ...base };
  const localJava = path.join(toolchainRoot, "jdk");
  const localSdk = path.join(toolchainRoot, "android-sdk");
  if (!env.JAVA_HOME && existsSync(path.join(localJava, "bin/java"))) env.JAVA_HOME = localJava;
  if (!env.ANDROID_HOME && !env.ANDROID_SDK_ROOT && existsSync(localSdk)) env.ANDROID_HOME = localSdk;
  const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT;
  if (sdk === localSdk) env.ANDROID_AVD_HOME ||= path.join(toolchainRoot, "android-avd");
  const additions = [env.JAVA_HOME && path.join(env.JAVA_HOME, "bin"),
    sdk && path.join(sdk, "platform-tools"), sdk && path.join(sdk, "emulator"),
    sdk && path.join(sdk, "cmdline-tools/latest/bin")].filter(Boolean);
  env.PATH = [...additions, env.PATH || ""].join(path.delimiter);
  env.GRADLE_USER_HOME ||= path.join(toolchainRoot, "gradle");
  return env;
}
