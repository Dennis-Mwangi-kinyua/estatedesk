import { existsSync } from "node:fs";
import { chromium, type LaunchOptions } from "playwright";

/** Prefer the pinned Playwright browser; allow an installed browser on development hosts. */
export function launchTestBrowser(options: LaunchOptions = {}) {
  const configured = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  const system = !existsSync(chromium.executablePath()) && existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined;
  return chromium.launch({ headless: true, ...options, executablePath: configured || options.executablePath || system });
}
