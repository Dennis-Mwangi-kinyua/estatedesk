import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";

test("onboarding cards expose contact and setup actions, save errors, and confirm deletion", async ({ page }) => {
  const bundle = await build({
    entryPoints: [path.resolve("tests/e2e/fixtures/onboarding.tsx")], bundle: true, write: false,
    platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [{ name: "onboarding-fixture", setup(builder) {
      builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link", namespace: "fixture" }));
      builder.onResolve({ filter: /^\.\.\/actions$/ }, () => ({ path: "actions", namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "link" ? 'import React from "react"; export default function Link(props) { return React.createElement("a", props); }' : `
        async function save(data) {
          await new Promise(resolve => setTimeout(resolve, 100));
          if (data.get("internalNotes") === "fail") throw new Error("simulated outage");
          window.lastOnboardingAction = Object.fromEntries(data);
        }
        export const updateOnboardingRequestAction = save;
        export const quickUpdateOnboardingStatusAction = save;
        export const deleteOnboardingRequestAction = save;
      `, loader: "js", resolveDir: process.cwd() }));
    } }],
  });
  await page.goto("/register");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await page.setContent(`<html><head>${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system"><div class="estate-workspace p-4"><div id="fixture"></div></div></body></html>`);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Greenview Properties", exact: true }) });
  await expect(card.getByRole("link", { name: "Email applicant" })).toHaveAttribute("href", /mailto:jane%40example.test/);
  await expect(card.getByRole("link", { name: "Call applicant" })).toHaveAttribute("href", "tel:+254700000000");
  await expect(page.getByRole("link", { name: "Create organisation" })).toHaveAttribute("href", "/platform/organizations/new?requestId=request-qualified");
  await card.getByRole("button", { name: "Mark contacted" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { lastOnboardingAction?: { status?: string } }).lastOnboardingAction?.status)).toBe("CONTACTED");
  await card.getByText("Manage status and team notes", { exact: false }).click();
  await card.getByLabel("Team notes").fill("fail");
  await card.getByRole("button", { name: "Save changes" }).click();
  await expect(card.getByRole("alert")).toContainText("could not be updated");
  await card.getByLabel("Team notes").fill("Contacted applicant; ready to qualify.");
  await card.getByLabel("Request status").selectOption("QUALIFIED");
  await card.getByRole("button", { name: "Save changes" }).click();
  await expect(card.getByRole("alert")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as unknown as { lastOnboardingAction?: { status?: string } }).lastOnboardingAction?.status)).toBe("QUALIFIED");
  page.on("dialog", () => { throw new Error("Browser confirmation must not be shown"); });
  await card.getByRole("button", { name: "Delete request", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(card.getByRole("button", { name: "Delete request", exact: true })).toBeFocused();
  await card.getByRole("button", { name: "Delete request", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Greenview Properties");
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(card.getByRole("status").filter({ hasText: "Request deleted." })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
});
