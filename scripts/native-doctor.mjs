import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { androidEnvironment, workspaceRoot } from "./lib/android-environment.mjs";

const env = androidEnvironment();

const buildOnly = process.argv.includes("--android-build");
const json = process.argv.includes("--json");
const checks = [];
const suffix = process.platform === "win32" ? ".exe" : "";
function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8", timeout: 10000, env });
}
function works(result) { return !result.error && result.status === 0; }
function check(name, ok, next) {
  checks.push({ name, status: ok ? "PASS" : "MISSING", ...(ok ? {} : { next }) });
}
const sdk = [env.ANDROID_HOME, env.ANDROID_SDK_ROOT,
  path.join(homedir(), "Android/Sdk"), path.join(homedir(), "Library/Android/sdk"),
  env.LOCALAPPDATA ? path.join(env.LOCALAPPDATA, "Android/Sdk") : null,
].filter(Boolean).find(p => existsSync(path.join(p, "platform-tools")) || existsSync(path.join(p, "cmdline-tools")));
function javaTool(name) {
  return env.JAVA_HOME ? path.join(env.JAVA_HOME, "bin", `${name}${suffix}`) : name;
}
function compatibleJava(result) {
  const major = Number(`${result.stdout || ""}\n${result.stderr || ""}`.match(/(?:version\s+"?|javac\s+)(?:1\.)?(\d+)/)?.[1]);
  return works(result) && major >= 17;
}
check("Java runtime (17+)", compatibleJava(run(javaTool("java"), ["-version"])), "Install a compatible JDK and set JAVA_HOME to its installation.");
check("Java compiler (17+)", compatibleJava(run(javaTool("javac"), ["-version"])), "Install the full JDK; a Java runtime alone cannot build Android.");
check("Android SDK", !!sdk, "Install Android Studio and its SDK, then set ANDROID_HOME.");
const adb = sdk ? path.join(sdk, "platform-tools", `adb${suffix}`) : "adb";
check("Android platform tools", works(run(adb, ["version"])), "Install platform-tools using Android Studio's SDK Manager.");
const catalogPath = path.join(workspaceRoot, "apps/mobile/node_modules/react-native/gradle/libs.versions.toml");
if (existsSync(catalogPath)) {
  const catalog = readFileSync(catalogPath, "utf8");
  for (const [key, directory, label] of [
    ["compileSdk", "platforms", "Android compile SDK"],
    ["buildTools", "build-tools", "Android build tools"],
    ["ndkVersion", "ndk", "Android native development kit"],
  ]) {
    const version = catalog.match(new RegExp(`^${key} = "([\\d.]+)"`, "m"))?.[1];
    const location = version && sdk && path.join(sdk, directory, key === "compileSdk" ? `android-${version}` : version);
    const marker = key === "compileSdk" ? "android.jar" : "source.properties";
    check(`${label}${version ? ` ${version}` : ""}`, !!location && existsSync(path.join(location, marker)),
      "Run node scripts/android-setup.mjs --packages after reviewing SDK licences.");
  }
  check("CMake 3.22.1", !!sdk && existsSync(path.join(sdk, "cmake/3.22.1/bin", `cmake${suffix}`)),
    "Run node scripts/android-setup.mjs --packages after reviewing SDK licences.");
}
if (!buildOnly) {
  const emulator = sdk ? path.join(sdk, "emulator", `emulator${suffix}`) : "emulator";
  const avds = run(emulator, ["-list-avds"]);
  const devices = run(adb, ["devices"]);
  const hasDevice = works(devices) && devices.stdout.split(/\r?\n/).some(line => /^\S+\s+device$/.test(line.trim()));
  check("Android device or virtual device", hasDevice || (works(avds) && !!avds.stdout.trim()),
    "Create a phone in Android Studio Device Manager, or connect a phone with USB debugging authorized.");
}
if (!buildOnly && process.platform === "darwin") {
  const simulators = run("xcrun", ["simctl", "list", "devices", "available", "--json"]);
  let hasSimulator = false;
  try { hasSimulator = works(simulators) && Object.values(JSON.parse(simulators.stdout).devices).some(devices => devices.some(device => device.isAvailable)); } catch {}
  check("Xcode and iOS simulator", hasSimulator, "Install Xcode and at least one available iOS simulator device/runtime.");
}
const external = process.platform === "darwin" ? [] : ["iOS simulator requires macOS with Xcode."];
const result = { ready: checks.every(check => check.status === "PASS"), scope: buildOnly ? "android-build" : "local-development", checks, external };
if (json) console.log(JSON.stringify(result, null, 2));
else {
  for (const check of checks) console.log(`${check.status} ${check.name}${check.next ? ` — ${check.next}` : ""}`);
  for (const note of external) console.log(`EXTERNAL ${note}`);
  console.log("INFO This checks local tooling only. SDK package versions, licences, signing, push provisioning and real-device workflows still require verification.");
}
if (!result.ready) process.exitCode = 1;
