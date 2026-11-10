import { expect, test } from "playwright/test";
import { build } from "./build-fixture";
import { setFixtureContent, installWorkspaceStyles } from "./workspace-styles";
import path from "node:path";
test("collections and validated imports work on narrow mobile screens",async({page})=>{
 const bundle=await build({entryPoints:[path.resolve("tests/e2e/fixtures/collections.tsx")],bundle:true,write:false,platform:"browser",format:"iife",jsx:"automatic",tsconfig:"apps/web/tsconfig.json",define:{"process.env.NODE_ENV":'"production"'},plugins:[{name:"collections-actions",setup(builder){
  builder.onResolve({filter:/^next\/link$/},()=>({path:"link",namespace:"fixture"}));
  builder.onResolve({filter:/^\.\/actions$/},()=>({path:"actions",namespace:"fixture"}));
  builder.onLoad({filter:/.*/,namespace:"fixture"},args=>({contents:args.path==="link"?'import React from "react";export default function Link(props){return React.createElement("a",props)};':`
   export async function collectionAction(_state,form){window.collectionSubmission=Object.fromEntries(form);return {message:"Saved collection action"};}
   export async function runCsvImportAction(_state,form){const dryRun=form.get("mode")!=="commit";window.importSubmission=Object.fromEntries(form);return {ok:true,dryRun,kind:form.get("kind"),totalRows:1,validRows:1,created:dryRun?0:1,errors:[],preview:["Property"],rowResults:[],validationToken:dryRun?"fixture-preview":undefined,message:dryRun?"Validation passed":"Import completed"};}
  `,loader:"js",resolveDir:process.cwd()}));
 }}]});
 await page.goto("/register");
 const css=await page.locator('link[rel="stylesheet"]').evaluateAll(links=>links.map(link=>(link as HTMLLinkElement).href));
 await setFixtureContent(page,`<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${css.map(href=>`<link rel="stylesheet" href="${href}">`).join("")}</head><body><main class="estate-workspace p-3"><div id="fixture"></div></main></body></html>`);
 await installWorkspaceStyles(page);await page.addScriptTag({content:bundle.outputFiles[0].text});
 await expect(page.getByRole("heading",{name:"Collections today",exact:true})).toBeVisible();
 const account=page.getByRole("article").filter({has:page.getByRole("heading",{name:"Jane Tenant",exact:true})});
 const review=page.getByRole("article").filter({has:page.getByRole("heading",{name:"Payment review tenant",exact:true})});
 await expect(review.getByText("Preview & approve rent reminder",{exact:true})).toHaveCount(0);
 await account.getByText("Assign follow-up",{exact:true}).click();
 await account.getByLabel("Follow-up owner").selectOption("staff-fixture");
 await account.getByLabel("Next contact date (Nairobi)").fill("2026-12-01");
 await account.getByLabel("Next step / contact notes").fill("Call the tenant to confirm payment");
 await account.getByRole("button",{name:"Save follow-up"}).click();
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {collectionSubmission?:{operation:string}}).collectionSubmission?.operation)).toBe("assign");
 await account.getByText("Preview & approve rent reminder",{exact:true}).click();
 await account.getByRole("button",{name:"Approve reminder"}).click();
 expect(await page.evaluate(()=>(window as unknown as {collectionSubmission?:{operation:string}}).collectionSubmission?.operation)).toBe("assign");
 await account.getByRole("checkbox").check();await account.getByRole("button",{name:"Approve reminder"}).click();
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {collectionSubmission?:{operation:string}}).collectionSubmission?.operation)).toBe("remind");
 const imports=page.getByRole("region",{name:"Spreadsheet import"});
 await expect(imports.getByRole("button",{name:"Commit import"})).toBeDisabled();
 await imports.getByRole("button",{name:"Validate CSV"}).click();
 await expect(imports.getByRole("checkbox")).toBeEnabled();
 await imports.getByRole("checkbox").check();await expect(imports.getByRole("button",{name:"Commit import"})).toBeEnabled();
 await imports.getByLabel("CSV content").fill("name\nA different property");await expect(imports.getByRole("button",{name:"Commit import"})).toBeDisabled();
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:850});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
});
