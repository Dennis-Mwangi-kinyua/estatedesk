import { test, expect } from "playwright/test";
import { build } from "./build-fixture";
import path from "node:path";
import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";
test("organization directory has 16 linked cards in four desktop rows and adapts to mobile", async ({page}, testInfo) => {
  const bundle = await build({entryPoints:[path.resolve("tests/e2e/fixtures/organization-directory.tsx")],bundle:true,write:false,platform:"browser",format:"iife",jsx:"automatic",tsconfig:"apps/web/tsconfig.json",define:{"process.env":"{}"},plugins:[{name:"links",setup(builder){builder.onResolve({filter:/^next\/link$/},()=>({path:"link",namespace:"fixture"}));builder.onLoad({filter:/.*/,namespace:"fixture"},()=>({contents:'import React from "react"; export default function Link(props){return React.createElement("a",props);}',loader:"js",resolveDir:process.cwd()}));}}]});
  await page.goto("/register");
  const styles=await page.locator('link[rel="stylesheet"]').evaluateAll(links=>links.map(link=>(link as HTMLLinkElement).href));
  await setFixtureContent(page,`<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map(h=>`<link rel="stylesheet" href="${h}">`).join("")}</head><body class="estate-glass-system"><div id="fixture"></div></body></html>`);
  await installWorkspaceStyles(page);await page.addScriptTag({content:bundle.outputFiles[0].text});
  await expect(page.locator(".organization-directory-card")).toHaveCount(16);
  await expect(page.getByRole("link",{name:/Onboarding requests/})).toHaveAttribute("href","/platform/onboarding");
  for(const width of [320,390,768,1280]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    if(width===1280) {const rows=await page.locator(".organization-directory-card").evaluateAll(cards=>cards.map(card=>Math.round(card.getBoundingClientRect().top)));expect(new Set(rows).size).toBe(4);expect(rows.filter(top=>top===rows[0])).toHaveLength(4);}
    await page.screenshot({path:testInfo.outputPath(`directory-${width}.png`),fullPage:true});
  }
  await expect(page.locator(".organization-directory-card").first()).toHaveAttribute("href","/platform/organizations/org-0");
});
