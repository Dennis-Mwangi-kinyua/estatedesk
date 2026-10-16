import { setFixtureContent, installWorkspaceStyles } from "./workspace-styles";
import { expect, test } from "playwright/test";
import { build } from "esbuild";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

test("agreement cards clearly label status and signatures, remain clickable, and fit mobile and desktop", async ({page,baseURL}, testInfo) => {
  const bundle = await build({entryPoints:[path.resolve("tests/e2e/fixtures/agreement-cards.tsx")],bundle:true,write:false,platform:"browser",format:"iife",jsx:"automatic",tsconfig:"apps/web/tsconfig.json",define:{"process.env.NODE_ENV":'"production"'},plugins:[{name:"fixture-link",setup(builder){builder.onResolve({filter:/^@\/components\/navigation\/workspace-link$/},()=>({path:"link",namespace:"fixture"}));builder.onLoad({filter:/.*/,namespace:"fixture"},()=>({contents:'import React from "react"; export default function Link(props){return React.createElement("a",props)}',loader:"js",resolveDir:process.cwd()}));}}]});
  let css: string;
  const html = '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body class="estate-glass-system bg-background text-foreground"><div class="estate-workspace engineering-workspace min-h-screen" id="fixture"></div></body></html>';
  if (baseURL) {
    await page.goto(`${baseURL}/register`);
    const styles = await page.locator('link[rel="stylesheet"]').evaluateAll(links=>links.map(link=>(link as HTMLLinkElement).href));
    css = (await Promise.all(styles.map(async href=>(await page.request.get(href)).text()))).join("\n");
    await setFixtureContent(page,html);
  } else {
    const cssDir = path.resolve("apps/web/.next/static/css");
    css = readdirSync(cssDir,{recursive:true}).filter(file=>String(file).endsWith(".css")).map(file=>readFileSync(path.join(cssDir,String(file)),"utf8")).join("\n");
    await page.setContent(html);
  }
  await page.addStyleTag({content:css});
  await installWorkspaceStyles(page);
  await page.addStyleTag({content:"*,*::before,*::after{transition:none!important;animation:none!important}"});
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  for (const width of [320,360,768,1280]) {
    await page.setViewportSize({width,height:1000});
    for (const theme of ["light","dark"]) {
      await page.locator("html").evaluate((element,value)=>element.setAttribute("class",value),theme);
      await expect(page.getByRole("link")).toHaveCount(6);
      await expect(page.getByText("Awaiting organization signature",{exact:true})).toBeVisible();
      await expect(page.getByText("Signed by both parties",{exact:true})).toBeVisible();
      await expect(page.getByText("Cancellation reason:",{exact:true})).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const heading = page.getByRole("heading",{name:"A clear view. A lighter day.",exact:true});
      expect(await heading.evaluate(el=>({singleLine:el.getBoundingClientRect().height <= parseFloat(getComputedStyle(el).lineHeight)+1,fits:el.scrollWidth <= el.clientWidth+1}))).toEqual({singleLine:true,fits:true});
      const cards = page.getByRole("link");
      for (let index=0;index<6;index++) await expect(cards.nth(index)).toHaveAttribute("href",`/platform/agreements/agreement-${index}`);
      await page.screenshot({path:testInfo.outputPath(`agreement-cards-${width}-${theme}.png`),fullPage:true});
    }
  }
});
