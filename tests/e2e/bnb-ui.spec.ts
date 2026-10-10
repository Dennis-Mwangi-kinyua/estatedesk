import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";
import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";

test("BnB editing preserves saved values, previews photos, and handles save feedback", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const bundle = await build({ entryPoints: [path.resolve("tests/e2e/fixtures/bnb-form.tsx")], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json", define: { "process.env": "{}", "process.env.NODE_ENV": '"production"' }, plugins: [{ name: "bnb-form-fixture", setup(builder) {
    builder.onResolve({ filter: /^next\/(link|image)$/ }, (args) => ({ path: args.path, namespace: "fixture" }));
    builder.onResolve({ filter: /features\/bnb\/actions$|^\.\.\/actions$/ }, () => ({ path: "actions", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({ contents: args.path === "actions" ? 'export async function saveBnbAction(state, form) { return {error: `Draft checked: ${form.get("title")}`}; }' : args.path === "next/image" ? 'import React from "react"; export default function Image({unoptimized, priority, fill, ...props}) {return React.createElement("img", props);}' : 'import React from "react"; export default function Link(props) {return React.createElement("a", props);}', loader: "js", resolveDir: process.cwd() }));
  } }] });
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
  await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map((href) => `<link rel="stylesheet" href="${href}">`).join("")}</head><body><main class="estate-workspace mx-auto max-w-5xl p-4"><h1>Edit BnB listing</h1><div id="fixture"></div></main></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await expect(page.getByLabel("Bedrooms", { exact: true })).toHaveValue("0");
  await expect(page.getByLabel("Bathrooms", { exact: true })).toHaveValue("2");
  await expect(page.getByLabel("Beds", { exact: true })).toHaveValue("3");
  await expect(page.getByLabel("Maximum guests")).toHaveValue("5");
  await expect(page.getByLabel("Cleaning fee (KES)")).toHaveValue("750");
  await expect(page.getByLabel("Minimum nights")).toHaveValue("3");
  await expect(page.getByLabel("Contact name")).toHaveValue("Jane Host");
  await expect(page.getByLabel("Wi-Fi", { exact: true })).toBeChecked();
  await page.getByLabel("Add photos").setInputFiles({ name: "stay.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aA8kAAAAASUVORK5CYII=", "base64") });
  await expect(page.getByRole("img", { name: "New photo 1" })).toBeVisible();
  for (const theme of ["light", "dark"]) {
    await page.locator("html").evaluate((element, value) => element.setAttribute("class", value), theme);
    const contrast = await page.getByLabel("Listing title").evaluate((element) => {
      const style = getComputedStyle(element);
      const luminance = (color: string) => {
        const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((value) => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const foreground = luminance(style.color), background = luminance(style.backgroundColor);
      return { ratio: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05), color: style.color, background: style.backgroundColor };
    });
    expect(contrast.ratio, JSON.stringify(contrast)).toBeGreaterThanOrEqual(4.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`bnb-form-${theme}.png`), fullPage: true });
  }
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert")).toHaveText("Draft checked: Kilimani sunny apartment");
  await expect(page.getByLabel("Cleaning fee (KES)")).toHaveValue("750");
  expect(errors).toEqual([]);
});

test("public stays load without login and unpublished URLs return 404", async ({ page }) => {
  test.setTimeout(90000);
  const response = await page.goto("/stays");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Find your next stay" })).toBeVisible();
  await expect(page.getByRole("link", { name: "BnB stays", exact: true }).first()).toHaveAttribute("href", "/stays");
  // Check the server response directly; development hot reloads can interrupt
  // browser navigation while the missing-listing route compiles for the first time.
  const unavailable = await page.request.get("/stays/not-a-published-bnb-listing");
  expect(unavailable.status()).toBe(404);
  await page.goto("/dashboard/org/airbnb/new");
  await expect(page).toHaveURL(/\/login/);
});
