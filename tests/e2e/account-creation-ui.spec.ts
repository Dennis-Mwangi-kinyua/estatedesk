import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";
import { expect, test, type Page } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";

// Test the actual UI with a simulated server response; no accounts or messages are created.
async function mountWizard(page: Page, draft?: Record<string, string>, fromRequest = false) {
  const bundle = await build({
    entryPoints: [path.resolve(fromRequest ? "tests/e2e/fixtures/account-creation-prefill.tsx" : "tests/e2e/fixtures/account-creation.tsx")], bundle: true, write: false,
    platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
    define: { "process.env": "{}", "process.env.NODE_ENV": '"production"' },
    plugins: [{ name: "next-link-fixture", setup(builder) {
      builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: "next-link", namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: 'import React from "react"; export default function Link(props) { return React.createElement("a", props); }', loader: "js", resolveDir: process.cwd() }));
    } }],
  });
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  if (draft) await page.evaluate(value => sessionStorage.setItem("organisation-draft", JSON.stringify(value)), draft);
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
  await setFixtureContent(page, `<html><head>${styles.map((href) => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system"><div class="estate-workspace p-4"><div id="fixture"></div></div></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
}

test("account wizard handles validation, server errors, success, and PDF download", async ({ page }) => {
  test.setTimeout(90_000);
  await mountWizard(page);
  await page.getByRole("button", { name: "Continue to owner login" }).click();
  await expect(page.locator("#fixture").getByRole("alert").first()).toContainText("Enter a workspace name");
  await page.getByLabel(/Agency name/).fill("Reserved agency");
  await page.getByRole("button", { name: "Continue to owner login" }).click();
  await expect(page.locator("#fixture").getByRole("alert").first()).toContainText("already in use");
  await page.getByLabel(/Agency name/).fill("Test agency");
  await expect(page.locator("#fixture").getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Continue to owner login" }).click();
  await page.getByLabel("Full name", { exact: false }).fill("Jane Example");
  await page.getByLabel(/Username/).fill("jane.example");
  await page.getByLabel(/Login email/).fill("jane@example.test");
  await page.getByRole("button", { name: "Generate secure password" }).click();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("organisation-draft"))).not.toBeNull();
  const draft = await page.evaluate(() => JSON.parse(sessionStorage.getItem("organisation-draft")!));
  expect(draft.adminPassword).toBeUndefined();
  expect(draft.adminPasswordConfirm).toBeUndefined();
  expect(draft.organizationName).toBe("Test agency");
  await page.getByRole("button", { name: "Review account" }).click();
  await page.getByLabel(/I have checked/).check();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.locator("#fixture").getByRole("alert").first()).toContainText("already in use");
  await page.getByRole("button", { name: /Username: Choose another/ }).click();
  await page.getByLabel(/Username/).fill("jane.updated");
  await expect(page.locator("#fixture").getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Review account" }).click();
  await page.getByLabel(/I have checked/).check();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Account created", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("organisation-draft"))).toBeNull();
  await expect(page.getByRole("link", { name: "Open organisation", exact: true })).toHaveAttribute("href", "/platform/organizations/test-agency");
  await expect(page.getByLabel(/Include the temporary password/)).not.toBeChecked();
  const pendingDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download credentials PDF", exact: true }).click();
  expect((await pendingDownload).suggestedFilename()).toBe("estatedesk-test-agency-credentials.pdf");
});


test("draft recovery restores details without restoring passwords and inputs remain readable in dark mode", async ({ page }) => {
  await mountWizard(page, { organizationName: "Recovered agency", adminFullName: "Jane Example", adminUsername: "jane", adminEmail: "jane@example.test", adminPassword: "never-restore-this", adminPasswordConfirm: "never-restore-this" });
  await expect(page.getByRole("status")).toContainText("Draft restored");
  await expect(page.getByLabel(/Agency name/)).toHaveValue("Recovered agency");
  await page.locator("html").evaluate(element => element.classList.add("dark"));
  const ratio = () => page.getByLabel(/Agency name/).evaluate(element => {
    const style = getComputedStyle(element);
    const luminance = (color: string) => {
      const channels = color.match(/\d+(?:\.\d+)?/g)!.slice(0, 3).map(Number).map(n => { const v = n / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const a = luminance(style.color), b = luminance(style.backgroundColor);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  await expect.poll(ratio).toBeGreaterThanOrEqual(4.5);
  await page.getByRole("button", { name: "Continue to owner login" }).click();
  await expect(page.getByLabel("Temporary password", { exact: false })).toHaveValue("");
  await expect(page.getByLabel("Confirm password", { exact: false })).toHaveValue("");
});


test("qualified onboarding requests prefill creation and submit their source request", async ({ page }) => {
  await mountWizard(page, undefined, true);
  await expect(page.getByLabel(/Agency name/)).toHaveValue("Applicant Portfolio");
  await expect(page.getByLabel(/Organisation email/)).toHaveValue("applicant@example.test");
  await page.getByRole("button", { name: "Continue to owner login" }).click();
  await expect(page.getByLabel("Full name", { exact: false })).toHaveValue("Applicant Owner");
  await expect(page.getByLabel(/Login email/)).toHaveValue("applicant@example.test");
  await page.getByLabel(/Username/).fill("applicant-owner");
  await page.getByRole("button", { name: "Generate secure password" }).click();
  await page.getByRole("button", { name: "Review account" }).click();
  await page.getByLabel(/I have checked/).check();
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Account created", exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { submittedRequestId: string }).submittedRequestId)).toBe("qualified-request");
});
