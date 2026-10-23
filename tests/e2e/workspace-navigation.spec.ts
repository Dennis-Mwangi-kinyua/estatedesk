import { expect, test } from "playwright/test";
import { build } from "./build-fixture";
import path from "node:path";
import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";

test("role navigation is grouped, scoped and has one current destination on desktop and mobile", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const bundle = await build({
    entryPoints: [path.resolve("tests/e2e/fixtures/workspace-navigation.tsx")], bundle: true, write: false,
    platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
    define: { "process.env": "{}" }, plugins: [{ name: "navigation-fixture", setup(builder) {
      builder.onResolve({ filter: /^(next\/link|next\/navigation|@\/features\/auth\/actions\/logout-action|@\/components\/help\/in-app-help-nav)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({
        contents: args.path === "next/link" ? 'import React from "react"; export default function Link({prefetch, ...props}) { return React.createElement("a", props); }'
          : args.path === "next/navigation" ? 'export const usePathname = () => window.__navigationPath;'
            : args.path.includes("logout-action") ? 'export const logoutAction = () => {};'
              : 'export const InAppHelpNav = () => null;',
        loader: "js", resolveDir: process.cwd(),
      }));
    } }],
  });
  await page.goto("/register");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system estate-workspace"><div id="fixture"></div></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const mobile = (page.viewportSize()?.width ?? 0) < 1024;
  const selectRole = async (role: string) => {
    await page.getByLabel("Fixture role").selectOption(role);
    if (mobile && !["CARETAKER", "PLATFORM_ADMIN"].includes(role)) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  };
  const current = () => page.locator('nav:visible:not([aria-label="Organisation quick navigation"]) a[aria-current="page"]');
  await selectRole("ACCOUNTANT");
  await expect(current()).toHaveCount(1);
  await expect(current()).toHaveText("Accounting requests");
  if (mobile) {
    const dock = page.getByRole("navigation", { name: "Organisation quick navigation" });
    await expect(dock.locator('a[aria-current="page"]')).toHaveCount(1);
    await expect(dock.locator('a[aria-current="page"]')).toHaveText("Requests");
  }
  await expect(page.getByRole("link", { name: "Tenants", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Finance", exact: true }).filter({ visible: true })).toBeVisible();
  if (mobile) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Workspace navigation" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toBeFocused();
  }
  if (mobile) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((el, value) => el.setAttribute("class", value), theme);
    await page.screenshot({ path: testInfo.outputPath(`accountant-navigation-${theme}.png`), fullPage: true });
  }
  await selectRole("ADMIN");
  await expect(current()).toHaveCount(1);
  await expect(current()).toHaveText("Completion reports");
  await selectRole("SECURITY");
  await expect(current()).toHaveText("Gate access");
  await expect(page.getByRole("link", { name: "Payments", exact: true })).toHaveCount(0);
  await selectRole("TENANT");
  await expect(current()).toHaveText("Overview");
  await page.getByRole("button", { name: "Toggle lease" }).click();
  await expect(page.getByRole("link", { name: "Payments", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "My history", exact: true }).filter({ visible: true })).toBeVisible();
  await selectRole("CARETAKER");
  await expect(current()).toHaveText("Today's Work");
  await expect(page.getByRole("link", { name: "My Tenants", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Gate access", exact: true })).toBeVisible();
  await selectRole("PLATFORM_ADMIN");
  await expect(current()).toHaveText("System Docs");
  await expect(page.getByRole("link", { name: "Website Control", exact: true })).toHaveCount(0);
  await page.getByLabel("Filter tools").fill("nothing-matches");
  await expect(page.getByRole("status")).toHaveText("No matching navigation. Try another search.");
  await page.getByLabel("Filter tools").fill("queues");
  await expect(page.getByRole("link", { name: "Jobs & Queues", exact: true })).toBeVisible();
  await page.getByLabel("Filter tools").fill("");
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((el, value) => { el.setAttribute("class", value); }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`navigation-${theme}.png`), fullPage: true });
  }
  expect(errors).toEqual([]);
});
