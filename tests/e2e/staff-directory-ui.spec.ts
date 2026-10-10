import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";
import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";

test("staff directory wraps contacts and keeps actions usable from phones to desktop", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const mocks: Record<string, string> = {
    "next/link": 'import React from "react"; export default function Link({prefetch,...props}) { return React.createElement("a",props); }',
    "@/components/help/in-app-guide-hint": 'export function InAppGuideHint(){return null;}',
    "@/lib/public-id": 'export const encodePublicId=(id)=>id;',
  };
  const bundle = await build({ entryPoints: [path.resolve("tests/e2e/fixtures/staff-directory.tsx")], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json", define: { "process.env": "{}", "process.env.NODE_ENV": '"production"' }, plugins: [{ name: "staff-fixture", setup(builder) {
    builder.onResolve({ filter: /^(next\/link|@\/components\/help\/in-app-guide-hint|@\/lib\/public-id)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "js", resolveDir: process.cwd() }));
  } }] });
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system ed-mobile-first"><div id="fixture"></div></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.locator("html").evaluate((el, value) => el.setAttribute("class", value), theme);
      await expect(page.getByRole("heading", { name: "Staff directory", exact: true })).toBeVisible();
      const add = page.getByRole("link", { name: "Add new staff", exact: true });
      await expect(add).toHaveAttribute("href", "/staff/new");
      expect((await add.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (width < 1024) {
        const contact = page.getByText("averylongstaffemailaddresswithoutspaces@organisation.example.test", { exact: true }).first();
        await expect(contact).toBeVisible();
        expect(await contact.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        const bounds = await contact.boundingBox();
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      }
      const previous = page.getByRole("link", { name: "Previous", exact: true });
      await expect(previous).toHaveAttribute("tabindex", "-1");
      await expect(page.getByRole("link", { name: "Next", exact: true })).toHaveAttribute("href", "/staff?page=2&pageSize=20");
      if ([390, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath(`staff-${width}-${theme}.png`), fullPage: true });
    }
  }
  const workflow = page.getByText("How staff management works", { exact: true });
  await workflow.click();
  await expect(page.getByText("Review roster", { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});
