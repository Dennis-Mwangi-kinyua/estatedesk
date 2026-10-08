import { installWorkspaceStyles } from "./workspace-styles";
import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";

test("modern messages inbox supports reading, replies, status actions, and mobile navigation", async ({ page }, testInfo) => {
  page.on("pageerror", error => console.error("Messages fixture error:", error.message));
  const bundle = await build({
    entryPoints: [path.resolve("tests/e2e/fixtures/messages.tsx")], bundle: true, write: false,
    platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json",
    define: { "process.env": "{}", "process.env.NODE_ENV": '"production"' },
    plugins: [{ name: "messages-fixture", setup(builder) {
      builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: "link", namespace: "fixture" }));
      builder.onResolve({ filter: /^@\/lib\/(prisma|permissions\/guards|db\/retry)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      builder.onResolve({ filter: /^\.\.\/actions$/ }, () => ({ path: "actions", namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => {
        const mocks: Record<string, string> = {
          link: 'import React from "react"; export default function Link(props) { return React.createElement("a", props); }',
          "@/lib/permissions/guards": 'export const requirePlatformRole = async () => ({ platformRole: "SUPER_ADMIN" });',
          "@/lib/db/retry": 'export const retryTransientDatabaseOperation = async operation => operation();',
          "@/lib/prisma": `import { fixtureMessages } from "./messages-data"; export const prisma = { platformMessage: { findMany: async () => fixtureMessages.map(message => ({...message, createdAt: new Date(message.createdAt)})), count: async () => fixtureMessages.length, groupBy: async () => ["OPEN", "READ", "CLOSED"].map(status => ({status, _count: {_all: 1}})) }, onboardingRequest: { count: async () => 2, findMany: async () => [{id: "request-1", companyName: "Palm Court", fullName: "John"}, {id: "request-2", companyName: "Sunrise Portfolio", fullName: "Mary"}] } };`,
          actions: `function action(name) { return async data => { await new Promise(resolve => setTimeout(resolve, 100)); if (name === "spam") throw new Error("simulated outage"); window.lastMessageAction = { name, id: data.get("messageId") }; }; }
            export const markPlatformMessageReadAction = action("read"); export const markPlatformMessageSpamAction = action("spam"); export const deletePlatformMessageAction = action("delete"); export const closePlatformMessageAction = action("close"); export const reopenPlatformMessageAction = action("reopen");`,
        };
        return { contents: mocks[args.path], loader: "js", resolveDir: args.path === "@/lib/prisma" ? path.resolve("tests/e2e/fixtures") : process.cwd() };
      });
    } }],
  });
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await page.setContent(`<html><head>${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system"><div class="estate-workspace p-4"><div id="fixture"></div></div></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await expect(page.getByRole("heading", { name: "Your support inbox" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Message queues" })).toBeVisible();
  await page.getByRole("button", { name: /Greenview Properties.*Help with water billing/ }).click();
  await expect(page.getByRole("heading", { name: "Help with water billing" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reply via email" })).toHaveAttribute("href", /mailto:jane%40example.test\?subject=Re%3A/);
  await expect(page.getByRole("link", { name: "Call sender" })).toHaveAttribute("href", "tel:+254700000000");
  await page.getByRole("button", { name: "Mark read", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { lastMessageAction?: { name: string } }).lastMessageAction?.name)).toBe("read");
  await page.getByRole("button", { name: "Mark spam", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Could not update" }).first()).toBeVisible();
  page.on("dialog", () => { throw new Error("Browser confirmation must not be shown"); });
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { lastMessageAction?: { name: string } }).lastMessageAction?.name)).toBe("read");
  if (await page.getByRole("button", { name: "Back to messages" }).isVisible()) await page.getByRole("button", { name: "Back to messages" }).click();
  await page.getByRole("button", { name: /Riverside Estates.*Subscription question/ }).click();
  await page.getByRole("button", { name: "Reopen message" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { lastMessageAction?: { name: string } }).lastMessageAction?.name)).toBe("reopen");
  const widths = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport);
  await page.locator("html").evaluate(element => element.classList.add("dark"));
  await expect(page.getByRole("heading", { name: "Subscription question" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("messages-dark.png"), fullPage: true });
});
