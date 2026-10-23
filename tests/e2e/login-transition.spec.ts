import { test, expect } from "playwright/test";
import { build } from "./build-fixture";
import path from "node:path";

test("login keeps progress visible while the authenticated document loads", async ({ page }) => {
 const bundle = await build({
  stdin: { contents: `import React from "react"; import {createRoot} from "react-dom/client"; import LoginForm from "./apps/web/src/app/(auth)/login/LoginForm"; createRoot(document.getElementById("fixture")).render(<LoginForm loginAction={async()=>({success:true,redirectTo:"/login#workspace"})}/>);`, resolveDir: process.cwd(), loader: "tsx" },
  bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json", loader: { ".css": "empty", ".module.css": "empty" }, define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "link", setup(builder) { builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link", namespace: "fixture" })); builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: 'import React from "react"; export default function Link(props){return React.createElement("a",props)}', resolveDir: path.resolve(".") })); } }],
 });
 await page.goto("/login");
 await expect(page.getByLabel("Email or username")).toBeVisible();
 await page.evaluate(() => { document.body.innerHTML = '<div id="fixture"></div>'; });
 await page.evaluate(code => { (0, eval)(code); }, bundle.outputFiles[0].text);
 await page.getByLabel("Email or username").fill("jane");
 await page.getByLabel("Password", { exact: true }).fill("ExamplePass123");
 await page.getByRole("button", { name: "Log in", exact: true }).click({ noWaitAfter: true });
 await expect(page).toHaveURL(/#workspace$/);
 await expect(page.getByRole("heading", { name: "Opening your workspace" })).toBeVisible();
 await expect(page.getByRole("button", { name: "Opening workspace..." })).toBeDisabled();
});

test("workspace loading indicator is visible in a regular browser", async ({ page }) => {
 await page.goto("/login");
 await expect(page.getByLabel("Email or username")).toBeVisible();
 await page.evaluate(() => {
  delete document.documentElement.dataset.pwaLaunch;
  const loading = document.createElement("div");
  loading.className = "app-route-loading";
  loading.id = "test-loading";
  loading.setAttribute("role", "status");
  loading.textContent = "Loading your workspace";
  document.body.append(loading);
 });
 await expect(page.locator("#test-loading")).toBeVisible();
});

test("installed app reveals hydrated content before late resources finish", async ({ page }) => {
 const { setFixtureContent } = await import("./workspace-styles");
 const bundle = await build({
  stdin: { contents: `import React from "react"; import {createRoot} from "react-dom/client"; import {PwaLaunchScreen} from "./apps/web/src/components/pwa/pwa-launch-screen"; createRoot(document.getElementById("fixture")).render(<PwaLaunchScreen/>);`, resolveDir: process.cwd(), loader: "tsx" },
  bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
 });
 await page.goto("/login");
 await setFixtureContent(page, '<html><body><div id="fixture"></div><main>Workspace content</main></body></html>');
 await page.evaluate(() => {
  Object.defineProperty(document, "readyState", { configurable: true, get: () => "loading" });
  document.documentElement.dataset.pwaLaunch = "visible";
 });
 await page.addScriptTag({ content: bundle.outputFiles[0].text });
 await expect(page.locator("html")).toHaveAttribute("data-pwa-launch", "ready");
 expect(await page.evaluate(() => document.readyState)).toBe("loading");
 await expect(page.getByRole("main")).toHaveText("Workspace content");
});
