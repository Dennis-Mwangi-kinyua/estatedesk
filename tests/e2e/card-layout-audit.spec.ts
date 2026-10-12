import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";
import { readFileSync } from "node:fs";
import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";

test("management cards contain long content and remain comfortable beside navigation", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const exportOptions = readFileSync("apps/web/src/lib/reports/org-report-exports.ts", "utf8").match(/export const ORG_REPORT_EXPORTS[\s\S]*?\n\];/)![0];
  const mocks: Record<string, string> = {
    "@/lib/reports/org-report-exports": exportOptions,
    "@/lib/public-id": 'export const encodePublicId=(id,scope)=>scope+"-"+id;',
    "inspection-report-form": 'export function InspectionReportForm(){return null}',
    "settlement-preview-action": 'export async function getSettlementPreview(){return {issues:[],depositHeld:25000,outstandingBills:0,lines:[]}}',
    "next/link": 'import React from "react";export default function Link({prefetch,...props}){return React.createElement("a",props)}',
    "@/components/navigation/app-links": 'import React from "react";export function DeferredLink({prefetch,...props}){return React.createElement("a",props)}',
    "@/lib/ledger": 'export const formatLedgerCurrency=n=>new Intl.NumberFormat("en-KE",{style:"currency",currency:"KES"}).format(n);export const formatLedgerDate=()=>"12 Oct 2026";',
    "@/components/help/in-app-guide-hint": 'export function InAppGuideHint(){return null}',
    "@/components/help/in-app-guide-link": 'export function InAppGuideLink(){return null}',
    "@/components/notifications/notification-view-button": 'import React from "react";export function NotificationViewButton(){return React.createElement("button",null,"View notification")}',
    "@/app/(app)/dashboard/org/notifications/actions": 'export async function markAllOrgNotificationsReadAction(){};export async function markNotificationReadAction(){};export async function sendPaymentRemindersAction(){};export async function confirmMoveOutAction(){};',
  };
  const bundle = await build({ entryPoints: [path.resolve("tests/e2e/fixtures/card-layout-audit.tsx")], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", tsconfig: "apps/web/tsconfig.json", define: { "process.env.NODE_ENV": '"production"' }, plugins: [{ name: "audit-mocks", setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/reports\/org-report-exports$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onResolve({ filter: /^@\/lib\/public-id$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onResolve({ filter: /inspection-report-form$/ }, () => ({ path: "inspection-report-form", namespace: "fixture" }));
    builder.onResolve({ filter: /settlement-preview-action$/ }, () => ({ path: "settlement-preview-action", namespace: "fixture" }));
    builder.onResolve({ filter: /settings-data$/ }, () => ({ path: "settings-data", namespace: "fixture" }));
    builder.onResolve({ filter: /^(next\/link|@\/components\/navigation\/app-links|@\/lib\/ledger|@\/components\/help\/in-app-guide-(hint|link)|@\/components\/notifications\/notification-view-button|@\/app\/\(app\)\/dashboard\/org\/notifications\/actions)$/ }, args => ({ path: args.path, namespace: "fixture" }));
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "settings-data" ? 'export const formatLabel=s=>String(s).replaceAll("_"," ");' : mocks[args.path], loader: "ts", resolveDir: process.cwd() }));
  } }] });
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system ed-mobile-first"><div id="fixture"></div></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.locator("html").evaluate((el, value) => el.setAttribute("class", value), theme);
      // Let theme color transitions settle before measuring contrast.
      await page.waitForTimeout(250);
      await expect(page.getByRole("heading", { name: "Rent collection report", exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width} ${theme}: page overflow`).toBe(true);
      await expect(page.getByRole("region", { name: "Notice review queue" })).toBeVisible();
      const contrast = await page.locator('[data-audit="contrast"] > p, [data-audit="contrast"] .visual-sticker').evaluateAll(elements => elements.map(el => {
        const style = getComputedStyle(el);
        const luminance = (color: string) => { const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]; };
        const background = el.matches("p") ? getComputedStyle(el.parentElement!).backgroundColor : style.backgroundColor;
        const ink = luminance(style.color), wash = luminance(background);
        return { text: el.textContent, ratio: (Math.max(ink, wash) + .05) / (Math.min(ink, wash) + .05), minimum: el.matches("p") ? 4.5 : 3 };
      }));
      expect(contrast.filter(item => item.ratio < item.minimum), `${theme}: faint labels or icons`).toEqual([]);
      expect(await page.locator('[data-audit="contrast"] .visual-sticker').evaluateAll(elements => new Set(elements.map(el => getComputedStyle(el).color)).size)).toBeGreaterThanOrEqual(3);
      const violations = await page.locator('[data-audit] :is(article, .workspace-panel, .workspace-card-grid > *, .report-stat)').evaluateAll(elements => elements.filter(el => el.getBoundingClientRect().width > 0 && el.scrollWidth > el.clientWidth + 1).map(el => ({ text: el.textContent?.slice(0, 100), width: el.clientWidth, scroll: el.scrollWidth })));
      expect(violations, `${width} ${theme}: overflowing cards`).toEqual([]);
      const widths = await page.locator('.workspace-card-grid > *').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().width));
      expect(Math.min(...widths), `${width}: cramped overview`).toBeGreaterThanOrEqual(220);
      const controls = await page.locator('input, select, button, a[data-page-button], a[data-workspace-action]').evaluateAll(elements => elements.filter(el => el.getBoundingClientRect().width > 0 && el.scrollWidth > el.clientWidth + 1).map(el => el.textContent));
      expect(controls, `${width}: overflowing controls`).toEqual([]);
      const lowContrast = await page.locator('[data-page-button="true"], .uniform-page-actions button:not(:disabled)').evaluateAll(elements => elements.filter(el => el.checkVisibility()).flatMap(el => {
        const style = getComputedStyle(el);
        const luminance = (color: string) => {
          const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
          return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
        };
        const ink = luminance(style.color), wash = luminance(style.backgroundColor);
        const contrast = (Math.max(ink, wash) + .05) / (Math.min(ink, wash) + .05);
        return contrast < 4.5 ? [{ text: el.textContent, contrast }] : [];
      }));
      expect(lowContrast, `${width} ${theme}: unreadable action labels`).toEqual([]);
      if (width === 390) {
        const queue = page.getByRole("region", { name: "Notice review queue" });
        await queue.locator("summary").click();
        await expect(queue.getByLabel("Actual handover date")).toBeVisible();
        await expect(queue.getByRole("button", { name: "Confirm handover and close", exact: true })).toBeDisabled();
        await queue.getByRole("button", { name: "Add cost", exact: true }).click();
        await expect(queue.getByLabel("Cost description")).toBeVisible();
        await queue.getByRole("button", { name: "Remove cost 1", exact: true }).click();
        await queue.locator("summary").click();
      }
      if ([390, 1280].includes(width)) {
        await page.screenshot({ path: testInfo.outputPath(`cards-${width}-${theme}.png`), fullPage: true });
        await page.locator('[data-audit="queue"]').screenshot({ path: testInfo.outputPath(`queue-${width}-${theme}.png`) });
        await page.locator('[data-audit="inspection"]').screenshot({ path: testInfo.outputPath(`inspection-${width}-${theme}.png`) });
      }
    }
  }
  expect(errors).toEqual([]);
});
