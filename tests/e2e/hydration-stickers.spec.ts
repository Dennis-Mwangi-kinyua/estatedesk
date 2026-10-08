import { expect, test } from "playwright/test";
import { build, type Plugin } from "esbuild";
import { createRequire } from "node:module";
import path from "node:path";
import { installWorkspaceStyles } from "./workspace-styles";

test.use({ timezoneId: "America/Los_Angeles" });

const plugin: Plugin = { name: "hydration-fixture", setup(builder) {
  builder.onResolve({ filter: /^next\/link$|^@\/components\/navigation\/app-links$/ }, args => ({ path: args.path, namespace: "fixture" }));
  builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "next/link" ? 'import React from "react"; export default function Link({prefetch,...props}){return React.createElement("a",props);}' : 'import React from "react"; export function DeferredLink(props){return React.createElement("a",props);}', loader: "js", resolveDir: process.cwd() }));
} };

test("hydrates dates and stored dismissals without mismatches and renders professional stickers", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const fixture = path.resolve("tests/e2e/fixtures/hydration-stickers.tsx");
  const server = await build({ entryPoints: [fixture], bundle: true, write: false, platform: "node", packages: "external", format: "cjs", jsx: "automatic", tsconfig: "apps/web/tsconfig.json", plugins: [plugin] });
  const module = { exports: {} as { renderFixture: () => React.ReactNode } };
  const fixtureRequire = createRequire(path.resolve("package.json"));
  new Function("require", "module", "exports", server.outputFiles[0].text)(fixtureRequire, module, module.exports);
  const { renderToString } = fixtureRequire("react-dom/server");
  const markup = renderToString(module.exports.renderFixture());
  const client = await build({ stdin: { contents: `import {hydrateRoot} from "react-dom/client"; import {renderFixture} from ${JSON.stringify(fixture)}; window.hydrationErrors=[]; hydrateRoot(document.getElementById("fixture"),renderFixture(),{onRecoverableError(error){window.hydrationErrors.push(error.message)}});`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json", define: { "process.env.NODE_ENV": '"production"' }, plugins: [plugin] });
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await page.setContent(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system"><div id="fixture">${markup}</div></body></html>`);
  await installWorkspaceStyles(page);
  await page.evaluate(() => sessionStorage.setItem("estatedesk:v1:vacancy-inquiries-dismissed:hydration-test", '["inquiry"]'));
  await page.addScriptTag({ content: client.outputFiles[0].text });
  await expect(page.getByText("Example Guest wants a vacant house")).toHaveCount(0);
  const hydrationErrors = await page.evaluate(() => (window as typeof window & { hydrationErrors: string[] }).hydrationErrors);
  expect(hydrationErrors).toEqual([]);
  expect(errors).toEqual([]);
  await expect(page.locator(".ed-sensitive-watermark__text").first()).toContainText("2026-10-08 23:59");
  await expect(page.getByRole("heading", { name: "Payments", exact: true })).toBeVisible();
  await expect(page.locator(".workspace-metric-sticker").first()).toHaveAttribute("aria-hidden", "true");
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, theme) => element.setAttribute("class", theme), theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`stickers-${theme}.png`), fullPage: true, animations: "disabled" });
  }
});
