import { test, expect } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";
import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";

test("dashboard cards fit their available width and mobile actions clear the dock", async ({ page }, testInfo) => {
  const bundle = await build({
    entryPoints: [path.resolve("tests/e2e/fixtures/dashboard-spacing.tsx")], bundle: true, write: false,
    platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [{ name: "navigation-fixture", setup(builder) {
      builder.onResolve({ filter: /^next\/(link|navigation)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({
        contents: args.path === "next/link" ? 'import React from "react";export default function Link({prefetch,...props}){return React.createElement("a",props)}' : 'export function usePathname(){return "/dashboard/tenant"}',
        loader: "js", resolveDir: process.cwd(),
      }));
    } }],
  });
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system ed-mobile-first"><div id="fixture"></div></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.locator("html").evaluate((el, theme) => el.setAttribute("class", theme), theme);
      await expect(page.getByText("Outstanding balance", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      const metrics = await page.locator(".workspace-metric").evaluateAll(elements => elements.map(el => ({ width: el.getBoundingClientRect().width, fits: el.scrollWidth <= el.clientWidth + 1 })));
      expect(metrics.every(metric => metric.fits && metric.width >= 190)).toBe(true);
      const dock = page.getByRole("navigation", { name: "Tenant quick navigation" });
      if (width < 1024) {
        await expect(dock).toBeVisible();
        await expect(dock.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
        await expect(dock.locator("svg")).toHaveCount(5);
        await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }); });
        const edit = await page.getByRole("link", { name: "Edit Profile", exact: true }).boundingBox();
        const nav = await dock.boundingBox();
        expect(edit!.y + edit!.height).toBeLessThan(nav!.y);
        await dock.getByRole("button", { name: "Open tenant navigation" }).click();
        await expect(dock.getByRole("button")).toHaveAttribute("aria-expanded", "true");
        await dock.getByRole("button").click();
      } else await expect(dock).toBeHidden();
      await page.screenshot({ path: testInfo.outputPath(`dashboard-${width}-${theme}.png`), fullPage: true });
    }
  }
});
