import {test,expect} from "playwright/test";
import {build} from "./build-fixture";
import path from "node:path";
import {installWorkspaceStyles,setFixtureContent} from "./workspace-styles";
test("private navigation, five-row layout, icons and button contrast work in both themes", async ({page},testInfo)=>{
  await page.emulateMedia({ reducedMotion: "reduce" });
  const bundle=await build({entryPoints:[path.resolve("tests/e2e/fixtures/workspace-consistency.tsx")],bundle:true,write:false,format:"iife",platform:"browser",jsx:"automatic",tsconfig:"apps/web/tsconfig.json",define:{"process.env":"{}"},plugins:[{name:"links",setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:"link",namespace:"fixture"}));b.onLoad({filter:/.*/,namespace:"fixture"},()=>({contents:'import React from "react"; export default function Link(props){return React.createElement("a",props);}',loader:"js",resolveDir:process.cwd()}));}}]});
  await page.goto("/register");const styles=await page.locator('link[rel="stylesheet"]').evaluateAll(links=>links.map(l=>(l as HTMLLinkElement).href));
  await setFixtureContent(page,`<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map(h=>`<link rel="stylesheet" href="${h}">`).join("")}</head><body class="estate-glass-system"><div id="fixture"></div></body></html>`);
  await installWorkspaceStyles(page);await page.addScriptTag({content:bundle.outputFiles[0].text});
  await expect(page.getByRole("link",{name:"Payments",exact:true})).toBeVisible();
  for(const name of ["Tenants","Settings","Website control"]) await expect(page.getByRole("link",{name,exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Switch role"}).click();await expect(page.getByRole("link",{name:"Settings",exact:true})).toBeVisible();await expect(page.getByRole("link",{name:"Website control",exact:true})).toHaveCount(0);
  for(const theme of ["light","dark"]){await page.locator("html").evaluate((el,t)=>el.setAttribute("class",t),theme);
    for(const name of ["Save changes","Logout","Cancel"]){const button=page.getByRole("button",{name,exact:true});await expect(button).toBeVisible();const contrast=await button.evaluate(el=>{const c=getComputedStyle(el);const lum=(s:string)=>{const values=(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});return values[0]*.2126+values[1]*.7152+values[2]*.0722;};const a=lum(c.color),b=lum(c.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);});expect(contrast,`${theme} ${name}`).toBeGreaterThanOrEqual(4.5);}
    const logout=await page.getByRole("button",{name:"Logout",exact:true}).evaluate(el=>getComputedStyle(el).backgroundColor);expect(logout).toBe(theme==="dark"?"rgb(255, 180, 186)":"rgb(180, 35, 50)");
    await expect(page.locator("[data-workspace-icon]")).toHaveCount(4);
    for(const width of [320,768,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);if(width>=768){const rows=await page.locator(".platform-recent-organizations > a").evaluateAll(cards=>cards.map(c=>Math.round(c.getBoundingClientRect().top)));expect(new Set(rows).size).toBe(5);expect(rows.filter(v=>v===rows[0])).toHaveLength(2);}await page.screenshot({path:testInfo.outputPath(`consistency-${theme}-${width}.png`),fullPage:true});}
  }
});
