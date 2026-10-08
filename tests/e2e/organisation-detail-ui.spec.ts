import {expect, test} from "playwright/test";
import {build} from "esbuild";
import path from "node:path";
test("organisation detail provides scoped operations and section navigation", async ({page}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const bundle = await build({entryPoints:[path.resolve("tests/e2e/fixtures/organisation-detail.tsx")], bundle:true, write:false, platform:"browser", format:"iife", jsx:"automatic", tsconfig:"apps/web/tsconfig.json", define:{"process.env":"{}","process.env.NODE_ENV": '\"production\"'}, plugins:[{name:"payments-fixture", setup(builder) {
    builder.onResolve({filter:/rename-organization$/},()=>({path:"rename",namespace:"fixture"}));
    builder.onResolve({filter:/^next\/link$/}, () => ({path:"link",namespace:"fixture"}));
    builder.onResolve({filter:/^\.\.\/actions$/}, () => ({path:"actions",namespace:"fixture"}));
    builder.onLoad({filter:/.*/,namespace:"fixture"}, args => ({contents: args.path === "rename" ? 'export const renamePlatformOrganizationAction=async(_state,data)=>{const name=String(data.get("organizationName")).trim();return name.length<2?{status:"error",message:"Enter an organisation name between 2 and 200 characters."}:{status:"success",message:"Organisation name updated.",name};};' : args.path === "link" ? 'import React from "react"; export default function Link(props){return React.createElement("a",props);}' : 'export const archiveOrganizationAction = async () => {}; export const permanentlyDeleteOrganizationAction = async () => {};', loader:"js", resolveDir:process.cwd()}));
  }}]});
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  await page.setContent(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system"><main class="estate-workspace p-4"><div id="fixture"></div></main></body></html>`);
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  for (const theme of ["light","dark"]) {
    await page.locator("html").evaluate((element,value) => element.setAttribute("class",value),theme);
    await expect(page.getByRole("heading",{name:"TSA Properties"})).toBeVisible();
    await expect(page.getByRole("link",{name:"Payment operations",exact:true})).toHaveAttribute("href","/platform/payment-ops?orgId=org-tsa");
    const navigation = page.getByRole("navigation",{name:"Organisation sections"});
    for (const section of ["profile","billing","operations","payments","members","audit"]) {
      await expect(page.locator(`#organisation-${section}`)).toBeAttached();
      await expect(navigation.locator(`a[href="#organisation-${section}"]`)).toBeVisible();
    }
    await expect(page.getByRole("button",{name:"Permanently delete organization"})).toBeAttached();
    expect(await page.locator("body").innerText()).not.toContain("✨");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`organisation-${theme}.png`),fullPage:true});
  }
  await page.getByRole("button",{name:"Edit name",exact:true}).click();
  await page.getByLabel("New organisation name").fill("  ");
  await page.getByRole("button",{name:"Save name",exact:true}).click();
  await expect(page.getByRole("alert")).toContainText("between 2 and 200");
  await page.getByLabel("New organisation name").fill("Updated Properties");
  await page.getByRole("button",{name:"Save name",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("Organisation name updated");
  await expect(page.getByText("Updated Properties",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Done",exact:true}).click();
  await expect(page.getByLabel("New organisation name")).toBeHidden();
  expect(errors).toEqual([]);
});
