import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";
import {expect, test} from "playwright/test";
import {build} from "esbuild";
import path from "node:path";
test("payments provide organisation links and readable responsive themes", async ({page}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const bundle = await build({entryPoints:[path.resolve("tests/e2e/fixtures/payments.tsx")], bundle:true, write:false, platform:"browser", format:"iife", jsx:"automatic", tsconfig:"apps/web/tsconfig.json", define: {"process.env":"{}","process.env.NODE_ENV": '\"production\"'}, plugins:[{name:"payments-fixture", setup(builder) {
    builder.onResolve({filter:/^next\/link$/}, () => ({path:"link",namespace:"fixture"}));
    builder.onResolve({filter:/^@\/lib\/(ledger|permissions\/guards)$/}, args => ({path:args.path,namespace:"fixture"}));
    builder.onLoad({filter:/.*/,namespace:"fixture"}, args => ({contents: args.path === "link" ? 'import React from "react"; export default function Link(props){return React.createElement("a",props);}' : args.path.endsWith("guards") ? 'export const requirePlatformRole = async () => ({});' : `export const formatLedgerCurrency = value => "Ksh " + value.toLocaleString(); export const formatLedgerDate = () => "4 Oct 2026"; export const getPlatformPaymentLedger = async () => ({period:"2026-10", totals:{organizations:1,listedOrganizations:1,paidOrganizations:1,expected:30000,paid:20000,deficit:10000},rows:[{orgId:"org-1",name:"Greenview Properties",slug:"greenview",tenantCount:12,expected:30000,paid:20000,deficit:10000,paymentCount:4,lastPaymentAt:new Date()}]});`, loader:"js", resolveDir:process.cwd()}));
  }}]});
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system"><main class="estate-workspace p-4"><div id="fixture"></div></main></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  await page.evaluate(() => new Promise(requestAnimationFrame));
  expect(errors).toEqual([]);
  for (const theme of ["light","dark"]) {
    await page.locator("html").evaluate((element,value) => element.setAttribute("class",value),theme);
    await expect(page.getByRole("heading",{name:"Organisation payments"})).toBeVisible();
    const organisation = page.getByRole("link",{name:"Greenview Properties",exact:true}).and(page.locator(":visible"));
    await expect(organisation).toHaveAttribute("href","/platform/organizations/greenview");
    await expect(page.getByLabel("Find an organisation")).toBeVisible();
    await expect(page.getByText("Ksh 10,000").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`payments-${theme}.png`),fullPage:true});
  }
  expect(errors).toEqual([]);
});
