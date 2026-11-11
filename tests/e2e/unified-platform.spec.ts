import { expect, test } from "playwright/test";
import { build } from "./build-fixture";
import path from "node:path";
import { readFileSync } from "node:fs";
import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";

test("one platform shell exposes all tools on desktop and phone despite an old developer preference", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const bundle = await build({
    entryPoints: [path.resolve("tests/e2e/fixtures/unified-platform.tsx")], bundle: true, write: false,
    loader: { ".css": "empty" }, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
    define: { "process.env": "{}" }, plugins: [{ name: "platform-fixture", setup(builder) {
      builder.onResolve({ filter: /^(next\/link|next\/navigation|@\/features\/auth\/actions\/logout-action|@\/components\/help\/in-app-help-nav)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({
        contents: args.path === "next/link" ? 'import React from "react"; export default function Link({prefetch, ...props}) { return React.createElement("a", props); }'
          : args.path === "next/navigation" ? 'export const usePathname = () => "/platform"; export const useRouter = () => ({ push() {}, replace() {}, prefetch() {} });'
          : args.path.includes("logout-action") ? 'export const logoutAction = () => {};'
          : 'export const InAppHelpNav = () => null;', loader: "js", resolveDir: process.cwd(),
      }));
    } }],
  });
  await page.goto("/login");
  await page.evaluate(() => localStorage.setItem("estatedesk.platform.mode", "developer"));
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system estate-workspace"><div id="fixture"></div></body></html>`);
  await installWorkspaceStyles(page);
  for (const file of ["platform-glass.css", "admin-glass.css"]) await page.addStyleTag({ content: readFileSync(path.resolve("apps/web/src/app/(app)/platform", file), "utf8") });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await expect(page.getByRole("heading", { name: "Your platform, in focus." })).toBeVisible();
  const mobile = (page.viewportSize()?.width ?? 0) < 1024;
  if (mobile) await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const nav = page.getByRole("navigation", { name: mobile ? "Platform menu" : "Platform navigation", exact: true });
  for (const name of ["Demo requests", "Organizations", "System Health", "Jobs & Queues", "Security"]) {
    await expect(nav.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: /Website Control/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Developer$/ })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("unified-platform.png"), fullPage: true });
  if (mobile) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Platform navigation" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  }
  expect(errors).toEqual([]);
});

for (const route of ["/rent-collection-software", "/property-management-onboarding"]) {
  test(`public workflow page is indexable and mobile friendly: ${route}`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route}$`));
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/);
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(schemas.length).toBeGreaterThan(0);
    for (const schema of schemas) expect(() => JSON.parse(schema)).not.toThrow();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain(route);
  });
}
