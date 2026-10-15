import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";
import { readFile } from "node:fs/promises";
import { expect, test, type Browser, type Page } from "playwright/test";

test.use({actionTimeout: 15_000, navigationTimeout: 45_000});
async function signIn(browser: Browser, baseURL: string, account: {email: string; password: string}) {
  const context = await browser.newContext({baseURL, serviceWorkers: "block"});
  const page = await context.newPage();
  await page.goto("/login", {waitUntil: "networkidle"});
  await page.getByRole("button", {name: "Show password", exact: true}).click();
  await page.getByLabel("Email or username").fill(account.email);
  await page.getByLabel("Password", {exact:true}).fill(account.password);
  await page.getByRole("button", {name:"Log in",exact:true}).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, {timeout:30_000});
  await page.waitForLoadState("networkidle");
  const updates = page.getByRole("button", {name:"Close what’s new",exact:true});
  if(await updates.isVisible()) {await updates.click();await page.waitForLoadState("networkidle");}
  return {context,page};
}
async function sign(page: Page, button: string) {
  const updates = page.getByRole("button", {name:"Close what’s new",exact:true});
  if (await updates.isVisible()) {await updates.click();await expect(updates).toBeHidden();}
  const label = await page.getByText(/^Your full account name:/).innerText();
  await page.getByLabel(/Your full account name:/).fill(label.replace("Your full account name:","").trim());
  await page.getByLabel("Type name", {exact:true}).check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", {name:button,exact:true}).click();
  await expect(page).toHaveURL(/ok=saved/, {timeout:30_000});
  await page.waitForLoadState("networkidle");
}
test("organization-specific agreement is signed, sent, isolated, countersigned and downloadable", async ({browser,baseURL}, testInfo) => {
  test.skip(!process.env.ROLE_WORKSPACE_FIXTURE, "Requires fictional local workspaces");
  test.skip(testInfo.project.name !== "chromium", "Workflow mutations run once");
  test.setTimeout(180_000);
  expect(new URL(baseURL!).hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
  const f = JSON.parse(await readFile(process.env.ROLE_WORKSPACE_FIXTURE!,"utf8"));
  const platform = await signIn(browser,baseURL!,f.accounts.PLATFORM_ADMIN);
  const org = await signIn(browser,baseURL!,f.accounts.ADMIN);
  const dbUrl = configureTestDatabase();
  if (!dbUrl) throw Error("TEST_DATABASE_URL is required for isolated agreement workflow tests");
  const db = new PrismaClient({adapter: new PrismaPg({connectionString: dbUrl})});
  const otherOrg = await db.organization.create({data: {name:"Agreement isolation test",slug:`agreement-isolation-${randomUUID()}`}});
  const otherPassword = "Disposable-agreement-QA-2026!";
  const otherUser = await db.user.create({data:{email:`agreement-${randomUUID()}@example.test`,fullName:"Other Organization Administrator",passwordHash:await hash(otherPassword,10),termsAcceptedAt:new Date()}});
  await db.membership.create({data:{orgId:otherOrg.id,userId:otherUser.id,role:"ADMIN"}});
  const other = await signIn(browser,baseURL!,{email:otherUser.email!,password:otherPassword});
  const clientErrors: string[] = [];
  for (const page of [platform.page, org.page, other.page]) {
    page.on("pageerror", error => clientErrors.push(error.message));
    page.on("console", message => {if(message.type() === "error" && /Content Security Policy|Minified React error #412/.test(message.text())) clientErrors.push(message.text());});
  }
  try {
    const page=platform.page;
    const response = await page.goto("/platform/agreements",{waitUntil:"networkidle"});
    const nonce = response!.headers()["content-security-policy"].match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    const inlineNonces = await page.locator("script:not([src])").evaluateAll(elements => elements.filter(element => element.textContent && (element as HTMLScriptElement).type !== "application/ld+json").map(element => (element as HTMLScriptElement).nonce));
    expect(inlineNonces.every(value => value === nonce)).toBe(true);
    await page.getByLabel("Organization",{exact:true}).selectOption(f.orgId);
    await page.getByLabel("Customer's full legal name").fill("Fictional Agreement Test Organization");
    await page.getByLabel("EstateDesk privacy and incident contact email").fill("privacy@example.test");
    await page.getByLabel("Service and commercial schedule").fill("Disposable local QA service agreement. No real subscription or commercial commitment.");
    await page.getByLabel("Subprocessors, hosting locations, and safeguards").fill("Disposable local PostgreSQL only. No production services or personal data used.");
    await page.getByLabel("Retention and exit schedule").fill("Disposable test records only. Remove after verification; no real retention promise.");
    await page.getByRole("button",{name:"Create unsigned draft"}).click();
    await expect(page).toHaveURL(/\/platform\/agreements\/[^/?]+$/, {timeout:30_000});
    await page.waitForLoadState("networkidle");
    const id = new URL(page.url()).pathname.split("/").at(-1)!;
    const draft=await org.context.request.get(`/api/service-agreements/${id}`);
    expect(draft.status()).toBe(404);
    const original=await page.getByLabel("Complete agreement text").inputValue();
    await page.getByLabel("Complete agreement text").fill(original+"\n\nCustomer-specific QA appendix: no live agreement is being executed.");
    await page.getByRole("button",{name:"Save draft revision"}).click();
    await expect(page).toHaveURL(/ok=saved/);await page.waitForLoadState("networkidle");
    await page.getByRole("button", {name:"Send to organization for signature",exact:true}).click();
    await expect(page).toHaveURL(/ok=saved/);await page.waitForLoadState("networkidle");
    expect((await platform.context.request.get(`/api/service-agreements/${id}`)).status()).toBe(409);
    const delivery = await db.notification.findFirst({where:{orgId:f.orgId,userId:f.accounts.ADMIN.id,title:"Service agreement ready for your signature"},orderBy:{createdAt:"desc"}});
    expect((delivery?.providerResponse as {actionUrl?: string})?.actionUrl).toBe(`/dashboard/org/agreements/${id}`);
    await expect(page.getByLabel("Complete agreement text")).toHaveCount(0);
    expect((await other.context.request.get(`/api/service-agreements/${id}`)).status()).toBe(404);
    await org.page.goto(`/dashboard/org/agreements/${id}`,{waitUntil:"networkidle"});
    await expect(org.page.getByText("Customer-specific QA appendix: no live agreement is being executed.",{exact:false})).toBeVisible();
    let signingRequest: {url: string; headers: Record<string,string>; data: string} | undefined;
    org.page.on("request", request => { if(request.method() === "POST" && request.url().includes(`/agreements/${id}`) && request.headers()["next-action"]) signingRequest = {url:request.url(),headers:request.headers(),data:request.postData()!}; });
    await sign(org.page,"Sign and submit agreement");
    expect(signingRequest).toBeDefined();
    await org.context.request.post(signingRequest!.url,{headers:signingRequest!.headers,data:signingRequest!.data});
    expect(await db.documentEvent.count({where:{documentId:id,eventType:"COMPLETED"}})).toBe(0);
    expect((await org.context.request.get(`/api/service-agreements/${id}`)).status()).toBe(409);
    await page.reload({waitUntil:"networkidle"});
    await page.getByLabel(/Your full account name:/).fill("Someone Else");
    await page.getByLabel("Type name", {exact:true}).check();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", {name:"Countersign and complete agreement",exact:true}).click();
    await expect(page).toHaveURL(/error=action/);await page.waitForLoadState("networkidle");
    await sign(page,"Countersign and complete agreement");
    expect(await db.documentEvent.count({where:{documentId:id,eventType:"COMPLETED"}})).toBe(1);
    await org.page.reload({waitUntil:"networkidle"});
    await expect(org.page.getByText("COMPLETED",{exact:true})).toHaveCount(2);
    expect((await platform.context.request.get(`/api/service-agreements/${id}`)).status()).toBe(200);
    const pdf=await org.context.request.get(`/api/service-agreements/${id}`);
    expect(pdf.status()).toBe(200);expect(pdf.headers()["content-type"]).toBe("application/pdf");
    expect((await pdf.body()).subarray(0,4).toString()).toBe("%PDF");
    expect(pdf.headers()["cache-control"]).toContain("no-store");
    await page.reload({waitUntil:"networkidle"});
    await expect(page.getByRole("button",{name:"Countersign and complete agreement",exact:true})).toHaveCount(0);
    await expect(page.getByText("COMPLETED",{exact:true})).toHaveCount(2);
    for(const width of [360,1280]) {await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
    expect(clientErrors).toEqual([]);
  } finally {await platform.context.close();await org.context.close();await other.context.close();await db.organization.delete({where:{id:otherOrg.id}});await db.user.delete({where:{id:otherUser.id}});await db.$disconnect();}
});
