import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { androidEnvironment, workspaceRoot } from "./lib/android-environment.mjs";

const [action = "doctor", ...args] = process.argv.slice(2);
const env = androidEnvironment();
const mobile = path.join(workspaceRoot, "apps/mobile");
const commands = {
  doctor: [process.execPath, [path.join(workspaceRoot, "scripts/native-doctor.mjs"), ...args]],
  licenses: [process.platform === "win32" ? "sdkmanager.bat" : "sdkmanager", ["--licenses", ...args]],
  devices: ["adb", ["devices", "-l", ...args]],
  emulator: ["emulator", args.length ? args : ["-list-avds"]],
  run: [process.platform === "win32" ? "npm.cmd" : "npm", ["run", "android", "-w", "@estatedesk/mobile", "--", ...args]],
  build: [process.platform === "win32" ? "gradlew.bat" : "./gradlew", ["app:assembleDebug", "--no-daemon", "--max-workers=2", "-PreactNativeArchitectures=x86_64", ...args]],
};
if (!Object.hasOwn(commands, action)) throw new Error(`Unknown action ${action}. Use ${Object.keys(commands).join(", ")}.`);
if (action === "build" && !existsSync(path.join(mobile, "android/gradlew"))) {
  throw new Error("Generate Android first: cd apps/mobile && npx expo prebuild --platform android --no-install");
}
if (action === "run" || action === "build") env.EXPO_PUBLIC_API_URL ||= "http://10.0.2.2:3000";
const [command, commandArgs] = commands[action];
const child = spawn(command, commandArgs, { cwd: action === "build" ? path.join(mobile, "android") : workspaceRoot, env, stdio: "inherit" });
child.on("error", error => { console.error(`${command}: ${error.message}. Run the Android setup task first.`); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
