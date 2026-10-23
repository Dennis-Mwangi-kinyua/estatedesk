import { installWorkspaceStyles, setFixtureContent } from "./workspace-styles";
import { expect, test, type Page } from "playwright/test";
import { build } from "./build-fixture";
import path from "node:path";
async function mount(page: Page, tenant: boolean | "unit" | "verify" | "verify-empty" | "leases" | "leases-empty"=false) {
 const bundle = await build({entryPoints:[path.resolve("tests/e2e/fixtures/portfolio.tsx")],bundle:true,write:false,platform:"browser",format:"iife",jsx:"automatic",tsconfig:"apps/web/tsconfig.json",define:{"process.env.NODE_ENV":'"production"',"process.env":"{}"},plugins:[{name:"portfolio-mocks",setup(builder){
 builder.onResolve({filter:/^@\/lib\/public-id$/},()=>({path:"public-id",namespace:"fixture"}));
 builder.onResolve({filter:/^next\/link$/},()=>({path:"link",namespace:"fixture"}));
 builder.onResolve({filter:/^next\/navigation$/},()=>({path:"navigation",namespace:"fixture"}));
 builder.onResolve({filter:/^\.\.\/actions$/},()=>({path:"unit-action",namespace:"fixture"}));
 builder.onResolve({filter:/create-tenant-action$/},()=>({path:"action",namespace:"fixture"}));
 builder.onResolve({filter:/^@\/components\/navigation\/app-links$/},()=>({path:"links",namespace:"fixture"}));
 builder.onLoad({filter:/.*/,namespace:"fixture"},args=>({contents:args.path==="public-id"?'export const encodePublicId=id=>id; export const encodePublicSlug=id=>id; export const decodePublicId=id=>id;':args.path==="unit-action"?'export const createUnitAction=async()=>{}; export const requestTenantTransferAction=async()=>{}; export const approveTenantTransferAction=async()=>{}; export const rejectTenantTransferAction=async()=>{};':args.path==="navigation"?'export const useRouter=()=>({prefetch(){},push(){}}); export const usePathname=()=>"/dashboard/org/properties";':args.path==="action"?'export const createTenantAction=async(_,data)=>{document.body.dataset.tenantSubmission=JSON.stringify(Object.fromEntries(data));return {status:"error",message:"Simulated server error"};};':args.path==="links"?'import React from "react"; export function DeferredLink(props){return React.createElement("a",props);} export const HoverPrefetchLink=DeferredLink;':'import React from "react"; export default function Link(props){return React.createElement("a",props);}',loader:"js",resolveDir:process.cwd()}));
 }}]});
 await page.goto(`/register?fixture=${Date.now()}-${Math.random()}${typeof tenant === "string" ? `#${tenant}` : tenant?"#tenant":""}`);
 const styles=await page.locator('link[rel="stylesheet"]').evaluateAll(links=>links.map(link=>(link as HTMLLinkElement).href));
 await setFixtureContent(page, `<html><head>${styles.map(href=>`<link rel="stylesheet" href="${href}">`).join("")}</head><body class="estate-glass-system"><div class="estate-workspace"><div id="fixture"></div></div></body></html>`);
 await installWorkspaceStyles(page);
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
 await expect(card.getByText("Pat Example", {exact:true})).toBeVisible();
 await expect(page.getByRole("link",{name:"Next",exact:true})).toHaveAttribute("href","/dashboard/org/leases?page=2");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator("html").evaluate(el=>el.classList.add("dark"));
 await expect(card).toBeVisible();
 await mount(page,"leases-empty");
 await expect(page.getByRole("heading",{name:"No leases found"})).toBeVisible();
});

test("tenant submission preserves details after a server error and on retry", async ({ page }) => {
 await mount(page, true);
 const next = () => page.getByRole("button", { name: "Continue", exact: true }).and(page.locator("button:visible")).click();
 await page.locator('[name="fullName"]').fill("Jane Example");
 await page.locator('[name="phone"]').fill("0712345678");
 await next();
 await page.locator('[name="nextOfKinName"]').fill("Alex Example");
 await page.locator('[name="nextOfKinRelationship"]').fill("Sibling");
 await page.locator('[name="nextOfKinPhone"]').fill("0712345679");
 await next();
 await next();
 await page.locator('[name="password"]').fill("ExamplePass123");
 await page.locator('[name="confirmPassword"]').fill("ExamplePass123");
 await next();
 const submit = page.locator('button[type="submit"]:visible');
 await submit.click();
 await expect(page.getByRole("alert")).toContainText("Simulated server error");
 await expect(page.locator('[name="fullName"]')).toHaveValue("Jane Example");
 await expect(page.locator('[name="phone"]')).toHaveValue("0712345678");
 await expect(page.locator('[name="nextOfKinName"]')).toHaveValue("Alex Example");
 await submit.click();
 await expect(page.locator('[name="fullName"]')).toHaveValue("Jane Example");
});

async function tenantLeaseStep(page: Page, existing = false) {
 await mount(page, true);
 if (existing) await page.getByRole("button", { name: "Existing tenant", exact: false }).click();
 const next = () => page.locator('button:visible').filter({ hasText: /^Continue$/ }).click();
 await page.locator('[name="fullName"]').fill("Jane Example");
 await page.locator('[name="phone"]').fill("0712345678");
 await next();
 await page.locator('[name="nextOfKinName"]').fill("Alex Example");
 await page.locator('[name="nextOfKinRelationship"]').fill("Sibling");
 await page.locator('[name="nextOfKinPhone"]').fill("0712345679");
 await next();
 await page.locator('button[aria-haspopup="listbox"]').click();
 await page.getByRole("option", { name: /Greenview \/ Unit A12/ }).click();
 return next;
}

test("new tenant reviews the agreed first bill instead of apartment default prices", async ({ page }) => {
 const next = await tenantLeaseStep(page);
 await expect(page.getByRole("heading", { name: "Previous unpaid bills" })).toHaveCount(0);
 await expect(page.locator('[name="monthlyRent"]')).toHaveValue("15000");
 await page.locator('[name="monthlyRent"]').fill("12500");
 await page.locator('[name="deposit"]').fill("5000");
 await next();
 await page.locator('[name="password"]').fill("ExamplePass123");
 await page.locator('[name="confirmPassword"]').fill("ExamplePass123");
 await next();
 await expect(page.locator("body")).not.toHaveAttribute("data-tenant-submission");
 await expect(page.getByText(/Total first bill:/)).toContainText("17,500");
 await expect(page.getByText(/First month rent:/)).toContainText("12,500");
 await page.locator('button[type="submit"]:visible').click();
 await expect(page.getByRole("alert")).toContainText("Simulated server error");
 const submitted = JSON.parse((await page.locator("body").getAttribute("data-tenant-submission"))!);
 expect(submitted.monthlyRent).toBe("12500");
 expect(submitted.deposit).toBe("5000");
 expect(submitted.existingLease).toBeUndefined();
 await page.locator('button:visible').filter({ hasText: /^Back$/ }).click();
 await page.locator('button:visible').filter({ hasText: /^Back$/ }).click();
 await expect(page.locator('[name="monthlyRent"]')).toHaveValue("12500");
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("existing tenant can import several old years and review unpaid balances", async ({ page }) => {
 const next = await tenantLeaseStep(page, true);
 await page.locator('[name="leaseStartDate"]').fill("1998-01-01");
 for (const year of ["1998", "2009", "2016"]) {
  await page.getByRole("spinbutton", { name: "Year to add" }).fill(year);
  await page.getByRole("button", { name: "Add year", exact: true }).click();
 }
 await page.locator('[name="openingArrears:1998-01"]').fill("123.45");
 await page.locator('[name="openingArrears:2009-12"]').fill("700");
 await page.locator('[name="openingArrears:2016-08"]').fill("900.5");
 await next();
 await page.locator('[name="password"]').fill("ExamplePass123");
 await page.locator('[name="confirmPassword"]').fill("ExamplePass123");
 await next();
 await expect(page.getByText("1998-01: 123.45", { exact: true })).toBeVisible();
 await expect(page.getByText("Total previous arrears: 1723.95", { exact: true })).toBeVisible();
 await expect(page.getByText("Initial rent and deposit charges will not be recreated.", { exact: true })).toBeVisible();
 await expect(page.getByText(/Total first bill:/)).toHaveCount(0);
 await page.locator('button[type="submit"]:visible').click();
 await expect(page.getByRole("alert")).toContainText("Simulated server error");
 const submitted = JSON.parse((await page.locator("body").getAttribute("data-tenant-submission"))!);
 expect(submitted.existingLease).toBe("on");
 expect(submitted["openingArrears:1998-01"]).toBe("123.45");
 expect(submitted["openingArrears:2009-12"]).toBe("700");
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
