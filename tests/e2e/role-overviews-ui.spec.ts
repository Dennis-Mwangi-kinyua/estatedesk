import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";

test("role overviews preserve actions and data in responsive light and dark layouts", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const bundle = await build({entryPoints: [path.resolve("tests/e2e/fixtures/role-overviews.tsx")], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json", define: {"process.env":"{}","process.env.NODE_ENV": '\"production\"'}, plugins: [{name: "role-fixture", setup(builder) {
    builder.onResolve({filter: /^next\/link$/}, () => ({path: "link", namespace: "fixture"}));
    builder.onResolve({filter: /^@\/components\/help\/in-app-guide-hint$/}, () => ({path: "help", namespace: "fixture"}));
    builder.onLoad({filter: /.*/, namespace: "fixture"}, args => ({contents: args.path === "help" ? 'export function InAppGuideHint() { return null; }' : 'import React from "react"; export default function Link(props) { return React.createElement("a", props); }', loader: "js", resolveDir: process.cwd()}));
  }}]});
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await page.setContent(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system"><main class="estate-workspace p-4"><div id="fixture"></div></main></body></html>`);
  await page.addScriptTag({content: bundle.outputFiles[0].text});
  await page.evaluate(() => new Promise(requestAnimationFrame));
  expect(errors).toEqual([]);
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, value) => { element.setAttribute("class", value); }, theme);
    await expect(page.getByRole("heading", {name: "Welcome back, Jane"})).toBeVisible();
    await expect(page.getByRole("link", {name: "View payments", exact: true})).toHaveAttribute("href", "/dashboard/tenant/payments");
    await expect(page.getByRole("link", {name: "Add tenant", exact: true})).toHaveAttribute("href", "/dashboard/org/tenants/new");
    await expect(page.getByRole("link", {name: "Today’s work", exact: true})).toHaveAttribute("href", "/dashboard/caretaker/today");
    await expect(page.getByRole("link", {name: "View statements", exact: true})).toHaveAttribute("href", "/dashboard/landlord/statements");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({path: testInfo.outputPath(`roles-${theme}.png`), fullPage: true});
  }
  expect(errors).toEqual([]);
});
