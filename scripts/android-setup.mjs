import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdir, rename, rm, stat, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { androidEnvironment, toolchainRoot, workspaceRoot } from "./lib/android-environment.mjs";

if (process.platform !== "linux" || process.arch !== "x64") {
  throw new Error("This portable bootstrap supports Linux x64. Use Android Studio on other systems.");
}
const downloads = path.join(toolchainRoot, "downloads");
await mkdir(downloads, { recursive: true });
function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const { input, ...spawnOptions } = options;
    const child = spawn(command, args, { cwd: workspaceRoot, env: androidEnvironment(), stdio: input === undefined ? "inherit" : ["pipe", "inherit", "inherit"], ...spawnOptions });
    if (input !== undefined) { child.stdin.on("error", () => {}); child.stdin.end(input); }
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)));
  });
}
async function checksum(file, algorithm) {
  const hash = createHash(algorithm);
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}
// Official release checksums. Binaries stay in ignored workspace storage.
const packages = [
  { name: "jdk.tar.gz", size: 193594705, algorithm: "sha256", checksum: "8b9b611d917e3dfd8419d3566b5949226f69b052fed7e109c1368add1dfe8711",
    url: "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.21%2B9/OpenJDK17U-jdk_x64_linux_hotspot_17.0.21_9.tar.gz" },
  { name: "android-tools.zip", size: 181052239, algorithm: "sha1", checksum: "e025545c62a8e64c7559119566a569fb1dec5f60",
    url: "https://dl.google.com/android/repository/commandlinetools-linux-16111833_latest.zip" },
];
async function download(pkg) {
  const archive = path.join(downloads, pkg.name);
  if (existsSync(archive) && (await stat(archive)).size === pkg.size && await checksum(archive, pkg.algorithm) === pkg.checksum) return archive;
  console.log(`Downloading ${pkg.name} from the official publisher (${Math.ceil(pkg.size / 1048576)} MB).`);
  // Small bounded transfers tolerate gateways that interrupt large responses.
  // Completed chunks are reused after a network interruption.
  const chunkSize = 1024 * 1024;
  const count = Math.ceil(pkg.size / chunkSize);
  const parts = Array(count);
  let cursor = 0;
  let completed = 0;
  await Promise.all(Array.from({ length: 1 }, async () => {
   while (cursor < count) {
    const index = cursor++;
    const start = chunkSize * index;
    const end = Math.min(pkg.size, start + chunkSize) - 1;
    const part = `${archive}.chunk${index}`;
    if (!existsSync(part) || (await stat(part)).size !== end - start + 1) {
      await run("curl", ["--fail", "--location", "--silent", "--show-error", "--retry", "2", "--retry-delay", "1", "--connect-timeout", "15", "--max-time", "90", "--range", `${start}-${end}`, pkg.url, "--output", part]);
    }
    if ((await stat(part)).size !== end - start + 1) throw new Error(`Invalid download range for ${pkg.name}; rerun setup to retry.`);
    parts[index] = part;
    completed++;
    if (completed % 25 === 0 || completed === count) console.log(`${pkg.name}: ${completed}/${count} chunks ready.`);
   }
  }));
  const temporary = `${archive}.complete`;
  await rm(temporary, { force: true });
  for (const part of parts) await pipeline(createReadStream(part), createWriteStream(temporary, { flags: "a" }));
  if (await checksum(temporary, pkg.algorithm) !== pkg.checksum) {
    await rm(temporary, { force: true });
    await Promise.all(parts.map(part => rm(part, { force: true })));
    throw new Error(`Publisher checksum mismatch for ${pkg.name}. Archive was not installed; rerun setup to download again.`);
  }
  await rename(temporary, archive);
  await Promise.all(parts.map(part => rm(part, { force: true })));
  console.log(`Verified ${pkg.name}.`);
  return archive;
}
if (!process.argv.includes("--packages") && !process.argv.includes("--emulator")) {
  const sdkOnly = process.argv.includes("--sdk-tools-only");
  const archives = [];
  for (const pkg of sdkOnly ? [packages[1]] : packages) archives.push(await download(pkg));
  const jdk = path.join(toolchainRoot, "jdk");
  if (!sdkOnly) {
    await mkdir(jdk, { recursive: true });
    await run("tar", ["-xzf", archives[0], "-C", jdk, "--strip-components=1"]);
  }
  const commandTools = path.join(toolchainRoot, "android-sdk/cmdline-tools");
  await mkdir(commandTools, { recursive: true });
  const staging = path.join(commandTools, "staging");
  await rm(staging, { recursive: true, force: true });
  await run("unzip", ["-q", archives[sdkOnly ? 0 : 1], "-d", staging]);
  await rm(path.join(commandTools, "latest"), { recursive: true, force: true });
  await rename(path.join(staging, "cmdline-tools"), path.join(commandTools, "latest"));
  await rm(staging, { recursive: true, force: true });
  if (!sdkOnly) await run(path.join(jdk, "bin/javac"), ["-version"]);
  console.log(`Portable ${sdkOnly ? "SDK command tools" : "JDK and SDK command tools"} installed. No system files changed.`);
  console.log("Next, review SDK licences: node scripts/android-dev.mjs licenses");
  console.log("Then install project SDK packages: node scripts/android-setup.mjs --packages");
} else {
  const env = androidEnvironment();
  const sdkmanager = path.join(env.ANDROID_HOME || env.ANDROID_SDK_ROOT || "", "cmdline-tools/latest/bin/sdkmanager");
  if (!existsSync(sdkmanager)) throw new Error("Run node scripts/android-setup.mjs first.");
  if (process.argv.includes("--emulator")) {
    const image = "system-images;android-36;google_apis;x86_64";
    await run(sdkmanager, ["--install", "emulator", image]);
    const avdHome = env.ANDROID_AVD_HOME;
    if (avdHome) await mkdir(avdHome, { recursive: true });
    if (!avdHome || !existsSync(path.join(avdHome, "EstateDesk_API_36.ini"))) {
      await run(path.join(path.dirname(sdkmanager), "avdmanager"), ["create", "avd", "--name", "EstateDesk_API_36", "--package", image], { input: "no\n" });
    }
    if (avdHome) {
      // The selected VS Code extension needs an executable directory and does
      // not expand ${workspaceFolder}. Generate a local launcher with our env.
      const launcherDirectory = path.join(toolchainRoot, "emulator-launcher");
      await mkdir(launcherDirectory, { recursive: true });
      const entry = pathToFileURL(path.join(workspaceRoot, "scripts/android-dev.mjs")).href;
      await writeFile(path.join(launcherDirectory, "emulator"), `#!/usr/bin/env node\nprocess.argv.splice(2, 0, "emulator");\nimport(${JSON.stringify(entry)}).catch(error => { console.error(error.message); process.exitCode = 1; });\n`, { mode: 0o755 });
      const settingsPath = path.join(workspaceRoot, ".vscode/settings.json");
      const settings = JSON.parse(await readFile(settingsPath, "utf8"));
      const previous = settings["emulator.emulatorPathLinux"];
      if (!previous || previous === "~/Android/Sdk/emulator" || previous === launcherDirectory) {
        settings["emulator.emulatorPathLinux"] = launcherDirectory;
        await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
        console.log("VS Code emulator extension configured for this workspace's private SDK and AVD.");
      } else console.log(`Custom emulator path preserved. To use this AVD, set emulator.emulatorPathLinux to ${launcherDirectory}`);
    }
    console.log("Start EstateDesk_API_36 using the VS Code emulator extension or node scripts/android-dev.mjs emulator -avd EstateDesk_API_36");
    process.exit(0);
  }
  // Match the installed React Native version catalog instead of stale documentation.
  const catalog = await readFile(path.join(workspaceRoot, "apps/mobile/node_modules/react-native/gradle/libs.versions.toml"), "utf8");
  function version(key) {
    const value = catalog.match(new RegExp(`^${key} = "([\\d.]+)"`, "m"))?.[1];
    if (!value) throw new Error(`Missing ${key} in React Native version catalog.`);
    return value;
  }
  await run(sdkmanager, ["--install", "platform-tools", `platforms;android-${version("compileSdk")}`, `build-tools;${version("buildTools")}`, `ndk;${version("ndkVersion")}`, "cmake;3.22.1"]);
  console.log("Android compilation packages installed. Run node scripts/android-dev.mjs doctor --android-build.");
}
