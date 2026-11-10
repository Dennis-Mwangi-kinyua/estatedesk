import { expect, test } from "playwright/test";
import { build } from "./build-fixture";
import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";
import path from "node:path";

test("organization blacklist requires a reason and confirmation and supports lock removal on mobile", async ({ page }) => {
  const bundle = await build({ entryPoints: [path.resolve("tests/e2e/fixtures/organization-blacklist.tsx")], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json", define: { "process.env.NODE_ENV": '"production"' }, plugins: [{ name: "blacklist-fixture", setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/public-id$/ }, () => ({ path: "public-id", namespace: "fixture" }));
    builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link", namespace: "fixture" }));
    builder.onResolve({ filter: /^\.\.\/actions$/ }, () => ({ path: "actions", namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "public-id" ? "export const encodePublicId=(id)=>id;" : args.path === "link" ? 'import React from "react";export default function Link(props){return React.createElement("a",props);}' : `
      export const archiveOrganizationAction=async()=>{};
      export const reactivateOrganizationAction=async()=>{};
      export const permanentlyDeleteOrganizationAction=async()=>{};
      export const blacklistOrganizationAction=async(form)=>{window.blacklistSubmission={action:"lock",...Object.fromEntries(form)}};
      export const unblacklistOrganizationAction=async(form)=>{window.blacklistSubmission={action:"unlock",...Object.fromEntries(form)}};
    `, loader: "js", resolveDir: process.cwd() }));
  } }] });
  await page.goto("/register");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body><main class="estate-workspace p-3"><div id="fixture"></div></main></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const form = page.locator("#organization-blacklist-lock");
  await expect(form).toContainText("including users who belong to other organizations");
  await form.getByRole("button", { name: "Blacklist and lock access" }).click();
  expect(await page.evaluate(() => "blacklistSubmission" in window)).toBe(false);
  await form.getByLabel("Reason for blacklisting").fill("Confirmed policy breach");
  await form.getByLabel("Type greenview to confirm").fill("greenview");
  await form.getByRole("button", { name: "Blacklist and lock access" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { blacklistSubmission?: { action: string } }).blacklistSubmission?.action)).toBe("lock");
  await page.getByRole("button", { name: "Toggle fixture lock" }).click();
  await expect(form).toContainText("Organization blacklisted — access locked");
  await form.getByLabel("Reason for removing the lock").fill("Reviewed and cleared");
  await form.getByLabel("Type greenview to confirm").fill("greenview");
  await form.getByRole("button", { name: "Remove blacklist lock" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { blacklistSubmission?: { action: string } }).blacklistSubmission?.action)).toBe("unlock");
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 850 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
});
