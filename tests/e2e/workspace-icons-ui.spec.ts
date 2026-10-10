import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";
import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";

test("semantic icons remain readable, labelled and aligned across workspaces", async ({page}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const bundle = await build({
    entryPoints:[path.resolve("tests/e2e/fixtures/workspace-icons.tsx")], bundle:true, write:false,
    platform:"browser", format:"iife", jsx:"automatic", tsconfig:"apps/web/tsconfig.json",
    define:{"process.env.NODE_ENV":'"production"'},
    plugins:[{name:"workspace-icons-fixture",setup(builder) {
      const mocks:Record<string,string> = {
        "next/link": 'import React from "react"; export default function Link({prefetch,...props}){return React.createElement("a",props)}',
        "next/navigation": 'export const usePathname=()=>"/dashboard/org";',
        "@/components/navigation/app-links": 'import React from "react"; export function HoverPrefetchLink(props){return React.createElement("a",props)}',
        "@/features/auth/actions/logout-action": 'export async function logoutAction(){}',
      };
      builder.onResolve({filter:/^(next\/(link|navigation)|@\/components\/navigation\/app-links|@\/features\/auth\/actions\/logout-action)$/},args=>({path:args.path,namespace:"fixture"}));
      builder.onLoad({filter:/.*/,namespace:"fixture"},args=>({contents:mocks[args.path],loader:"js",resolveDir:process.cwd()}));
    }}],
  });
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links=>links.map(link=>(link as HTMLLinkElement).href));
  await setFixtureContent(page, `<html><head><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(href=>`<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system ed-mobile-first"><div id="fixture"></div></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  await expect(page.getByRole("navigation",{name:"Organisation"})).toBeVisible();
  await expect(page.getByRole("navigation",{name:"Tenant"}).getByRole("link",{name:"Invoices",exact:true})).toBeVisible();
  await expect(page.getByRole("navigation",{name:"Tenant"}).getByRole("link",{name:"Invoices",exact:true}).locator("svg[data-workspace-icon]")).toHaveAttribute("data-workspace-icon","ReceiptText");
  await page.getByRole("button",{name:/Accountant Finance/}).click();
  await expect(page.locator('select[name="role"]')).toHaveValue("ACCOUNTANT");
  for(const width of [360,1440]) {
    await page.setViewportSize({width,height:1000});
    for(const theme of ["light","dark"]) {
      await page.locator("html").evaluate((el,value)=>el.setAttribute("class",value),theme);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      const contrast = await page.locator(".visual-sticker").evaluateAll(tiles=>tiles.map(tile=>{
        const style=getComputedStyle(tile);
        const luminance=(color:string)=>{const rgb=color.match(/[\d.]+/g)!.slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};
        const ink=luminance(style.color),wash=luminance(style.backgroundColor);
        return (Math.max(ink,wash)+.05)/(Math.min(ink,wash)+.05);
      }));
      expect(Math.min(...contrast)).toBeGreaterThanOrEqual(3);
      const icons=page.locator("svg[data-workspace-icon]");
      expect(await icons.count()).toBeGreaterThan(30);
      expect(await page.locator("svg.lucide").evaluateAll(elements => elements.every(el => parseFloat(getComputedStyle(el).strokeWidth) === 1.75))).toBe(true);
      expect(await icons.evaluateAll(elements=>elements.every(el=>el.getAttribute("aria-hidden")==="true" && el.getAttribute("focusable")==="false"))).toBe(true);
      const dimensions=await page.locator(".sidebar-sticker svg").evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().width));
      expect(Math.min(...dimensions)).toBeGreaterThanOrEqual(16);
      expect(Math.max(...dimensions)-Math.min(...dimensions)).toBeLessThanOrEqual(1);
      await page.screenshot({path:testInfo.outputPath(`icons-${width}-${theme}.png`),fullPage:true,animations:"disabled"});
    }
  }
  expect(errors).toEqual([]);
});
