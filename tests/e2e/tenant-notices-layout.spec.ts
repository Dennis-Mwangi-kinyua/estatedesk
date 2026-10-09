import { expect, test } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";
import { installWorkspaceStyles } from "./workspace-styles";

test("tenant notices give cards and progress steps enough room on laptops and phones", async ({page},testInfo)=>{
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  const bundle=await build({
    entryPoints:[path.resolve("tests/e2e/fixtures/tenant-notices-layout.tsx")],bundle:true,write:false,platform:"browser",format:"iife",jsx:"automatic",tsconfig:"apps/web/tsconfig.json",
    define:{"process.env.NODE_ENV":'"production"'},
    plugins:[{name:"notices-layout-fixture",setup(builder){
      const mocks:Record<string,string>={
        "next/link":'import React from "react";export default function Link({prefetch,...props}){return React.createElement("a",props)}',
        "next/navigation":'export function redirect(path){throw Error(`Unexpected redirect: ${path}`)}',
        "@/lib/permissions/guards":'export async function requireTenantAccess(){return {userId:"tenant-user",activeOrgId:"org"}}',
        "@/app/(app)/dashboard/tenant/notices/_lib/queries":'export async function getTenantNoticesData(){return window.__tenantNoticesData}',
        "@/lib/public-id":'export function encodePublicId(id,scope){return `${scope}--ed_${id}`}',
        "actions":'export async function submitMoveOutNotice(){window.noticeSubmitted=true} export async function withdrawMoveOutNotice(){return {ok:false,error:"Test only"}}',
      };
      builder.onResolve({filter:/^(next\/(link|navigation)|@\/lib\/(permissions\/guards|public-id)|@\/app\/\(app\)\/dashboard\/tenant\/notices\/(_lib\/queries|actions)|\.\.\/actions)$/},args=>({path:args.path.endsWith("actions")?"actions":args.path,namespace:"fixture"}));
      builder.onLoad({filter:/.*/,namespace:"fixture"},args=>({contents:mocks[args.path],loader:"js",resolveDir:process.cwd()}));
    }}],
  });
  await page.goto("/register");
  await page.waitForLoadState("networkidle");
  const styles=await page.locator('link[rel="stylesheet"]').evaluateAll(links=>links.map(link=>(link as HTMLLinkElement).href));
  await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(href=>`<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system ed-mobile-first"><div id="fixture"></div></body></html>`);
  await installWorkspaceStyles(page);
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  await expect(page.getByRole("heading",{name:"Received Notices",exact:true})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath("notices-initial.png"),fullPage:true,animations:"disabled"});
  for(const width of [360,768,1024,1280,1440]){
    await page.setViewportSize({width,height:1000});
    for(const scenario of ["populated","empty"]){
      await page.evaluate(async scenario=>{await (window as unknown as {renderNoticesScenario:(s:string)=>Promise<void>}).renderNoticesScenario(scenario)},scenario);
      await expect(page.getByText(scenario==="empty"?"No received notices":"Scheduled water maintenance for Greenview Gardens and Residences",{exact:true})).toBeVisible();
      for(const theme of ["light","dark"]){
        await page.locator("html").evaluate((el,value)=>el.setAttribute("class",value),theme);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
        // Include actual sidebar space at laptop widths; the content is narrower than the viewport.
        const cards=await page.locator('.tenant-notices-page > .tenant-notices-content > section').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}}));
        expect(cards).toHaveLength(3);
        expect(Math.abs(cards[0].width-cards[1].width)).toBeLessThan(2);
        expect(Math.abs(cards[1].width-cards[2].width)).toBeLessThan(2);
        expect(cards[1].top).toBeGreaterThan(cards[0].bottom);
        expect(cards[2].top).toBeGreaterThan(cards[1].bottom);
        if(scenario==="populated"){
          const entries=page.locator('[data-received-notice]');
          await expect(entries).toHaveCount(4);
          const entryWidths=await entries.evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().width));
          expect(Math.max(...entryWidths)-Math.min(...entryWidths)).toBeLessThan(2);
          const steps=await page.getByRole("list",{name:"Move-out progress"}).first().locator("li").evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,overflow:el.scrollWidth>el.clientWidth+1}}));
          expect(steps.every(step=>!step.overflow)).toBe(true);
          if(width>=1024)expect(Math.min(...steps.map(step=>step.width))).toBeGreaterThan(100);
        }
        if([360,1280,1440].includes(width))await page.screenshot({path:testInfo.outputPath(`notices-${scenario}-${width}-${theme}.png`),fullPage:true,animations:"disabled"});
      }
    }
  }
  // Preserve the mobile form and cancellation interaction without touching a real account.
  await page.evaluate(async()=>{await (window as unknown as {renderNoticesScenario:(s:string)=>Promise<void>}).renderNoticesScenario("populated")});
  await page.getByLabel("Intended handover date").fill("2027-01-01");
  await page.getByLabel("Notes",{exact:true}).fill("Morning handover requested.");
  await expect(page.getByLabel("Notes",{exact:true})).toHaveValue("Morning handover requested.");
  await page.getByRole("button",{name:"Cancel move-out notice",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Cancel this move-out notice?"})).toBeVisible();
  await page.getByRole("button",{name:"Keep notice",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Cancel this move-out notice?"})).toHaveCount(0);
  expect(errors).toEqual([]);
});
