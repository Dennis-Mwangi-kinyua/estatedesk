import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";
import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";

test("shared presentation keeps table labels, controls and dynamic rows usable", async ({page,isMobile},testInfo) => {
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 const bundle=await build({entryPoints:[path.resolve("tests/e2e/fixtures/site-experience.tsx")],bundle:true,write:false,platform:"browser",format:"iife",jsx:"automatic",tsconfig:"apps/web/tsconfig.json",define:{"process.env.NODE_ENV":'"production"'},plugins:[{name:"navigation",setup(builder){builder.onResolve({filter:/^next\/navigation$/},()=>({path:"navigation",namespace:"fixture"}));builder.onLoad({filter:/.*/,namespace:"fixture"},()=>({contents:'export const usePathname=()=>"/dashboard/org/payments";',loader:"js"}));}}]});
 await page.goto("/register");await page.waitForLoadState("networkidle");
 const styles=await page.locator('link[rel="stylesheet"]').evaluateAll(links=>links.map(link=>(link as HTMLLinkElement).href));
 await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(href=>`<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system ed-mobile-first"><div id="main-content" class="estate-workspace ed-mobile-first-root"><div id="fixture"></div></div></body></html>`);
 await installWorkspaceStyles(page);
  await page.addScriptTag({content:bundle.outputFiles[0].text});
 const table=page.getByRole("table",{name:"Payment records",exact:true});
 await expect(table).toHaveAttribute("data-mobile-cards","true");
 await expect(page.getByRole("heading",{level:1})).toHaveAttribute("data-workspace-heading-icon","WalletCards");
 await expect(table.locator("tbody tr")).toHaveCount(2);
 await expect(table.locator("tbody td").first()).toHaveAttribute("data-column-label","Tenant");
 await page.getByRole("button",{name:"Add fixture row"}).click();
 await expect(table.locator("tbody tr")).toHaveCount(3);
 await expect(table.locator("tbody tr").last().locator("td").nth(3)).toHaveAttribute("data-column-label","Amount");
 await expect(page.getByRole("table",{name:"Comparison"})).not.toHaveAttribute("data-mobile-cards","true");
 await expect(page.getByRole("table",{name:"Grouped table"})).not.toHaveAttribute("data-mobile-cards","true");
 expect(await table.evaluate(el=>getComputedStyle(el).display)).toBe(isMobile?"block":"table");
 if(isMobile){expect(await page.getByLabel("Search records").evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(48);expect(await page.getByRole("button",{name:"Add fixture row"}).evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);}
 for(const theme of ["light","dark"]){await page.locator("html").evaluate((el,value)=>el.setAttribute("class",value),theme);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:testInfo.outputPath(`site-${theme}.png`),fullPage:true});}
 const primary=page.getByRole("button",{name:"Add fixture row"});
 const legacy=page.getByRole("button",{name:"Legacy save"});
 for(const theme of ["light","dark"]){
  await page.locator("html").evaluate((el,value)=>el.setAttribute("class",value),theme);
  await page.waitForTimeout(220);
  const style=async(locator: typeof primary)=>locator.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,color:s.color,radius:s.borderRadius,height:el.getBoundingClientRect().height};});
  const p=await style(primary),l=await style(legacy);
  expect(l.background).toBe(p.background);expect(l.color).toBe(p.color);expect(l.radius).toBe(p.radius);
  expect(p.height).toBeGreaterThanOrEqual(44);
  expect((await style(page.getByRole("button",{name:"Secondary action"}))).background).not.toBe(p.background);
  expect((await style(page.getByRole("button",{name:"Delete sample"}))).background).not.toBe(p.background);
  await expect(page.getByRole("button",{name:"Hidden action",includeHidden:true})).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 expect(errors).toEqual([]);
});
