import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";
import {expect, test} from "playwright/test";
import {build} from "esbuild";
import path from "node:path";
import { expectReadableWords } from "./assert-readable-words";
test("organisation detail provides scoped operations and section navigation", async ({page}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const bundle = await build({entryPoints:[path.resolve("tests/e2e/fixtures/organisation-detail.tsx")], bundle:true, write:false, platform:"browser", format:"iife", jsx:"automatic", tsconfig:"apps/web/tsconfig.json", define:{"process.env":"{}","process.env.NODE_ENV": '\"production\"'}, plugins:[{name:"payments-fixture", setup(builder) {
    builder.onResolve({filter:/^\.\.\/billing-actions$/},()=>({path:"billing",namespace:"fixture"}));
    builder.onResolve({filter:/rename-organization$/},()=>({path:"rename",namespace:"fixture"}));
    builder.onResolve({filter:/update-organization-slug$/},()=>({path:"update-slug",namespace:"fixture"}));
    builder.onResolve({filter:/^next\/link$/}, () => ({path:"link",namespace:"fixture"}));
    builder.onResolve({filter:/^\.\.\/actions$/}, () => ({path:"actions",namespace:"fixture"}));
    builder.onLoad({filter:/.*/,namespace:"fixture"}, args => ({contents: args.path === "billing" ? 'export const organizationBillingAction=async(_state,data)=>({invoice:data.get("operation")==="invoice"?{filename:"invoice.pdf",content:"JVBERi10ZXN0"}:undefined,success:data.get("operation")==="invoice"?"Invoice ready to download.":data.get("operation")==="renew"?"Subscription renewed for 30 days.":"Subscription cancelled."});' : args.path === "rename" ? 'export const renamePlatformOrganizationAction=async(_state,data)=>{const name=String(data.get("organizationName")).trim();return name.length<2?{status:"error",message:"Enter an organisation name between 2 and 200 characters."}:{status:"success",message:"Organisation name updated.",name};};' : args.path === "update-slug" ? 'export const updatePlatformOrganizationSlugAction=async()=>({status:"success",message:"Organisation slug updated."});' : args.path === "link" ? 'import React from "react"; export default function Link(props){return React.createElement("a",props);}' : 'export const archiveOrganizationAction = async () => {}; export const permanentlyDeleteOrganizationAction = async () => {};', loader:"js", resolveDir:process.cwd()}));
  }}]});
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system ed-mobile-first"><main class="estate-workspace platform-theme-content ed-mobile-first-root p-3"><div id="fixture"></div></main></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  for (const theme of ["light","dark"]) {
    await page.locator("html").evaluate((element,value) => element.setAttribute("class",value),theme);
    await expect(page.getByRole("heading",{name:"TSA Properties"})).toBeVisible();
    await expect(page.getByRole("link",{name:"Payment operations",exact:true})).toHaveAttribute("href","/platform/payment-ops?orgId=tsa");
    await expect(page.locator("#organisation-agreement").getByRole("link",{name:/View DPA agreement/})).toHaveAttribute("href","/platform/agreements/agreement-tsa");
    await expect(page.getByRole("link",{name:"Download signed DPA",exact:true})).toHaveAttribute("href","/api/service-agreements/agreement-tsa");
    const navigation = page.getByRole("navigation",{name:"Organisation sections"});
    for (const section of ["profile","billing","agreement","operations","payments","members","audit"]) {
      await expect(page.locator(`#organisation-${section}`)).toBeAttached();
      await expect(navigation.locator(`a[href="#organisation-${section}"]`)).toBeVisible();
    }
    await expect(page.getByRole("button",{name:"Permanently delete organization",includeHidden:true})).toBeAttached();
    expect(await page.locator("body").innerText()).not.toContain("✨");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expectReadableWords(page, ".organisation-detail-page");
    await page.screenshot({path:testInfo.outputPath(`organisation-${theme}.png`),fullPage:true});
  }
  const billing = page.locator("#organisation-billing");
  await billing.getByRole("button", { name: "Renew subscription", exact: true }).click();
  const renewal = billing.getByRole("checkbox");
  await expect(renewal).not.toBeChecked();
  await expect(renewal).toHaveAttribute("required", "");
  await renewal.check();
  await billing.getByRole("button", { name: "Confirm renewal", exact: true }).click();
  await expect(billing.getByRole("status")).toContainText("renewed for 30 days");
  await billing.getByRole("button", { name: "Send an invoice", exact: true }).click();
  await expect(billing.getByRole("checkbox", { name: /Also send by email/ })).not.toBeChecked();
  await billing.getByRole("button", { name: "Generate invoice", exact: true }).click();
  await expect(billing.getByRole("status")).toContainText("Invoice ready to download");
  await expect(billing.getByRole("link", { name: "Download invoice PDF" })).toHaveAttribute("download", "invoice.pdf");
  await billing.getByRole("button", { name: "Cancel subscription", exact: true }).click();
  await billing.getByRole("checkbox").check();
  await billing.getByRole("button", { name: "Confirm cancellation", exact: true }).click();
  await expect(billing.getByRole("status")).toContainText("Subscription cancelled");
  await billing.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByText("Advanced organisation actions",{exact:true}).click();
  await expect(page.getByRole("button",{name:"Permanently delete organization",exact:true})).toBeVisible();
  await page.getByText("Advanced organisation actions",{exact:true}).click();
  for (const width of [320,360,390,768,1280]) {
    await page.setViewportSize({width,height:800});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`width ${width}`).toBe(true);
    await expect(page.getByRole("link",{name:"Payment operations",exact:true})).toBeVisible();
    await expect(page.locator("#organisation-operations")).toBeVisible();
    if(width<768){const cards=await page.locator(".org-summary-card").evaluateAll(elements=>elements.slice(0,2).map(el=>({top:el.getBoundingClientRect().top,left:el.getBoundingClientRect().left})));if(width<420){expect(cards[1].top).toBeGreaterThan(cards[0].top);expect(Math.abs(cards[0].left-cards[1].left)).toBeLessThan(1);}else{expect(Math.abs(cards[0].top-cards[1].top)).toBeLessThan(1);expect(cards[1].left).toBeGreaterThan(cards[0].left);}}

    const order=await page.evaluate(()=>{const kra=document.getElementById("organisation-kra")!,counts=document.getElementById("organisation-operations")!;return counts.getBoundingClientRect().top>=kra.getBoundingClientRect().bottom;});
    expect(order,`operations below KRA at ${width}`).toBe(true);
    await expectReadableWords(page, ".organisation-detail-page");
    await page.screenshot({path:testInfo.outputPath(`organisation-${width}.png`),fullPage:true});
  }
  await page.getByRole("button",{name:"Edit name",exact:true}).click();
  await page.getByLabel("New organisation name").fill("  ");
  await page.getByRole("button",{name:"Save name",exact:true}).click();
  await expect(page.getByRole("alert")).toContainText("between 2 and 200");
  await page.getByLabel("New organisation name").fill("Updated Properties");
  await page.getByRole("button",{name:"Save name",exact:true}).click();
  await expect(page.locator("#organisation-profile").getByRole("status")).toContainText("Organisation name updated");
  await expect(page.getByText("Updated Properties",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Done",exact:true}).click();
  await expect(page.getByLabel("New organisation name")).toBeHidden();
  expect(errors).toEqual([]);
});
