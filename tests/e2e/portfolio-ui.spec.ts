import { expect, test, type Page } from "playwright/test";
import { build } from "esbuild";
import path from "node:path";
async function mount(page: Page, tenant: boolean | "unit" | "verify" | "verify-empty" | "leases" | "leases-empty"=false) {
 const bundle = await build({entryPoints:[path.resolve("tests/e2e/fixtures/portfolio.tsx")],bundle:true,write:false,platform:"browser",format:"iife",jsx:"automatic",tsconfig:"apps/web/tsconfig.json",define:{"process.env.NODE_ENV":'"production"',"process.env":"{}"},plugins:[{name:"portfolio-mocks",setup(builder){
 builder.onResolve({filter:/^next\/link$/},()=>({path:"link",namespace:"fixture"}));
 builder.onResolve({filter:/^next\/navigation$/},()=>({path:"navigation",namespace:"fixture"}));
 builder.onResolve({filter:/^\.\.\/actions$/},()=>({path:"unit-action",namespace:"fixture"}));
 builder.onResolve({filter:/create-tenant-action$/},()=>({path:"action",namespace:"fixture"}));
 builder.onResolve({filter:/^@\/components\/navigation\/app-links$/},()=>({path:"links",namespace:"fixture"}));
 builder.onLoad({filter:/.*/,namespace:"fixture"},args=>({contents:args.path==="unit-action"?'export const createUnitAction=async()=>{}; export const requestTenantTransferAction=async()=>{}; export const approveTenantTransferAction=async()=>{}; export const rejectTenantTransferAction=async()=>{};':args.path==="navigation"?'export const useRouter=()=>({prefetch(){},push(){}}); export const usePathname=()=>"/dashboard/org/properties";':args.path==="action"?'export const createTenantAction=async()=>({status:"error",message:"Simulated server error"});':args.path==="links"?'import React from "react"; export function DeferredLink(props){return React.createElement("a",props);} export const HoverPrefetchLink=DeferredLink;':'import React from "react"; export default function Link(props){return React.createElement("a",props);}',loader:"js",resolveDir:process.cwd()}));
 }}]});
 await page.goto(`/register${typeof tenant === "string" ? `#${tenant}` : tenant?"#tenant":""}`); await page.waitForLoadState("networkidle");
 const styles=await page.locator('link[rel="stylesheet"]').evaluateAll(links=>links.map(link=>(link as HTMLLinkElement).href));
 await page.setContent(`<html><head>${styles.map(href=>`<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system"><div class="estate-workspace"><div id="fixture"></div></div></body></html>`);
 await page.addScriptTag({content:bundle.outputFiles[0].text});
}
test("properties cards are responsive and keep details and navigation accessible",async({page})=>{
 await mount(page); await expect(page.getByRole("heading",{level:1})).toContainText("Your properties");
 await expect(page.getByRole("article")).toHaveCount(3);
 const card=page.getByRole("article").first(); await card.locator("summary").click(); await expect(card.getByText("Contact management before arranging access.")).toBeVisible();
 await expect(card.getByRole("link",{name:"View Greenview Residences"})).toHaveAttribute("href","/dashboard/org/properties/property-0");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator("html").evaluate(el=>el.classList.add("dark")); await expect(card).toBeVisible();
});
test("tenant setup validates and advances with progress and preserves entered details",async({page})=>{
 await mount(page,true); await expect(page.getByRole("heading",{level:1})).toContainText("Welcome a new tenant");
 await page.getByRole("button",{name:"Continue",exact:true}).and(page.locator("button:visible")).click();
 await expect(page.getByRole("alert")).toContainText("Full name is required");
 await page.locator('input[name="fullName"]').fill("Jane Example"); await page.locator('input[name="phone"]').fill("0712345678");
 await page.getByRole("button",{name:"Continue",exact:true}).and(page.locator("button:visible")).click();
 await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow","2");
 await page.getByRole("button",{name:"Back",exact:true}).and(page.locator("button:visible")).click();
 await expect(page.locator('input[name="fullName"]')).toHaveValue("Jane Example");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("unit setup validates, preserves values and reviews before submitting", async ({page}) => {
 await mount(page, "unit");
 await page.getByRole("button", {name:"Continue",exact:true}).click();
 await expect(page.getByRole("alert")).toBeVisible();
 await page.locator('[name="houseNo"]').fill("A12");
 await page.getByRole("button", {name:"Continue",exact:true}).click();
 await expect(page.locator('[name="houseNo"]')).toBeHidden();
 await page.locator('[name="bedrooms"]').fill("2");
 await page.getByRole("button", {name:"Continue",exact:true}).click();
 await page.locator('[name="rentAmount"]').fill("20000");
 await page.getByRole("button", {name:"Review unit"}).click();
 await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow","4");
 await expect(page.getByText("A12", {exact:true})).toBeVisible();
 await expect(page.getByText("20000", {exact:true})).toBeVisible();
 await page.getByRole("button", {name:"Back",exact:true}).click();
 await expect(page.locator('[name="rentAmount"]')).toHaveValue("20000");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("tenant verification has accessible mobile search and a helpful no-match state", async ({page}) => {
 await mount(page, "verify");
 await expect(page.getByRole("heading", {level:1})).toContainText("Know your tenant");
 await expect(page.getByRole("heading", {name:"Start with their details"})).toBeVisible();
 const search=page.getByRole("searchbox",{name:"Tenant details"});
 await search.fill("ab");
 await page.getByRole("button",{name:"Verify tenant",exact:true}).click();
 expect(await search.evaluate((el:HTMLInputElement)=>el.validity.tooShort)).toBe(true);
 await expect(page.locator("form[method=get]")).toHaveAttribute("action","/dashboard/org/verify-tenant");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await mount(page, "verify-empty");
 await expect(page.getByRole("heading", {name:"No matching records"})).toBeVisible();
 await expect(page.getByRole("link", {name:"Add a new tenant"})).toHaveAttribute("href","/dashboard/org/tenants/new");
 await page.locator("html").evaluate(el=>el.classList.add("dark"));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("leases show responsive cards, agreement navigation, details and pagination", async ({page}) => {
 await mount(page,"leases");
 await expect(page.getByRole("heading",{level:1})).toContainText("Your leases");
 await expect(page.getByRole("article")).toHaveCount(3);
 const card=page.getByRole("article").first();
 await expect(card.getByRole("link",{name:"View lease for Jane Example"})).toHaveAttribute("href","/dashboard/org/leases/lease-0");
 await card.locator("summary").click();
 await expect(card.getByText("Day 5 each month")).toBeVisible();
 await expect(card.getByRole("link",{name:"Pat Example"})).toHaveAttribute("href","/staff/staff-0");
 await expect(page.getByRole("link",{name:"Next",exact:true})).toHaveAttribute("href","/dashboard/org/leases?page=2");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator("html").evaluate(el=>el.classList.add("dark"));
 await expect(card).toBeVisible();
 await mount(page,"leases-empty");
 await expect(page.getByRole("heading",{name:"No leases found"})).toBeVisible();
});
