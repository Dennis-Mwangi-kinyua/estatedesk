import { createHash, randomBytes, randomUUID } from "node:crypto";
import { test, expect } from "playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configureTestDatabase } from "../integration/database-safety";
import type { NativeActionDefinition } from "../../packages/contracts/src/mobile";

test.use({actionTimeout:15000,navigationTimeout:30000});
test("signed-in native collections share scoped follow-ups, promises and approved reminders with the mobile web workspace",async({page,request,context,baseURL},info)=>{
 const databaseUrl=configureTestDatabase();test.skip(!databaseUrl||info.project.name!=="chromium","Requires disposable local records; mutations run once");test.setTimeout(120000);
 const db=new PrismaClient({adapter:new PrismaPg({connectionString:databaseUrl!})});const tag=randomUUID();const now=new Date();const past=new Date(now.getTime()-86400000*10);
 const users=await Promise.all(["Staff","Tenant"].map(name=>db.user.create({data:{fullName:name,passwordHash:"test-only",termsAcceptedAt:now}})));
 const [staff,tenantUser]=users;const org=await db.organization.create({data:{name:`Collections ${tag}`,slug:`collections-${tag}`,subscription:{create:{plan:"PRO",status:"ACTIVE",currentPeriodStart:past,currentPeriodEnd:new Date(now.getTime()+86400000*365)}}}});
 const foreignOrg=await db.organization.create({data:{name:`Foreign ${tag}`,slug:`foreign-collections-${tag}`}});
 try{
  const membership=await db.membership.create({data:{orgId:org.id,userId:staff.id,role:"ADMIN",scopeType:"ORG"}});
  const tenant=await db.tenant.create({data:{orgId:org.id,userId:tenantUser.id,fullName:"Native collection tenant",phone:"0700000000",email:"tenant@example.invalid"}});
  const foreign=await db.tenant.create({data:{orgId:foreignOrg.id,fullName:"Other organization tenant",phone:"0700000001"}});
  const property=await db.property.create({data:{orgId:org.id,name:"Greenview"}});const unit=await db.unit.create({data:{propertyId:property.id,houseNo:"A1",rentAmount:1000,status:"OCCUPIED"}});
  const lease=await db.lease.create({data:{orgId:org.id,tenantId:tenant.id,unitId:unit.id,startDate:past,monthlyRent:1000}});
  await db.rentCharge.create({data:{orgId:org.id,leaseId:lease.id,period:"2026-10",amountDue:1000,balance:1000,dueDate:past,status:"OVERDUE"}});
  const token=randomBytes(32).toString("hex");await db.userSession.create({data:{userId:staff.id,activeMembershipId:membership.id,tokenHash:createHash("sha256").update(token).digest("hex"),expiresAt:new Date(now.getTime()+3600000)}});
  const productionBackend=process.env.E2E_PRODUCTION_BACKEND==="1";const name=productionBackend?"__Host-estatedesk_session":"estatedesk_session";const headers={Cookie:`${name}=${token}`,"X-EstateDesk-Client":"native","X-EstateDesk-Capabilities":"2026-10-18","X-EstateDesk-Forms":"2026-11-09"};
  const path="/dashboard/org/collections";const base={kind:"organization",path};
  const screen=await request.get(`/api/mobile/workspace/screen?${new URLSearchParams(base)}`,{headers});expect(screen.status(),await screen.text()).toBe(200);expect((await screen.json()).records[0].id).toBe(tenant.id);
  const statementParams={kind:"organization",path:"/dashboard/org/collections/statement",recordId:tenant.id};
  const statement=await request.get(`/api/mobile/workspace/screen?${new URLSearchParams(statementParams)}`,{headers});
  expect(statement.status(),await statement.text()).toBe(200);
  const statementBody=await statement.json();expect(statementBody.records).toHaveLength(1);expect(statementBody.hasMore).toBe(false);
  expect(statementBody.notice).toContain("Native collection tenant");expect(statementBody.records[0].fields.some((field:{label:string})=>field.label==="Remaining balance")).toBe(true);
  const foreignStatement=await request.get(`/api/mobile/workspace/screen?${new URLSearchParams({...statementParams,recordId:foreign.id})}`,{headers});
  expect(foreignStatement.status()).toBe(200);expect((await foreignStatement.json()).records).toHaveLength(0);
  const action=async(actionId:string,changes:Record<string,string>)=>{
   const params={...base,actionId,recordId:tenant.id};const response=await request.get(`/api/mobile/workspace/action?${new URLSearchParams(params)}`,{headers});expect(response.status(),await response.text()).toBe(200);
   const definition=await response.json() as NativeActionDefinition;const values=Object.fromEntries(definition.groups.flatMap(group=>group.fields.map(field=>[field.name,field.defaultValue??""])));
   const result=await request.post("/api/mobile/workspace/action",{headers,data:{...params,values:{...values,...changes},submissionId:randomUUID()}});expect(result.status(),await result.text()).toBe(200);expect((await result.json()).ok).toBe(true);
  };
  const template=await request.get("/api/mobile/imports?kind=properties",{headers});expect(template.status()).toBe(200);
  const importInput={kind:"properties",csv:"name\nNative imported property",mode:"dry-run",submissionId:randomUUID()};
  const preview=await request.post("/api/mobile/imports",{headers,data:importInput});expect(preview.status(),await preview.text()).toBe(200);
  const previewBody=await preview.json();expect(previewBody.ok,JSON.stringify(previewBody)).toBe(true);expect(previewBody.validationToken).toBeTruthy();
  expect(await db.property.count({where:{orgId:org.id,name:"Native imported property"}})).toBe(0);
  const changed=await request.post("/api/mobile/imports",{headers,data:{...importInput,csv:"name\nChanged without revalidation",mode:"commit",validationToken:previewBody.validationToken,confirmImport:"yes",submissionId:randomUUID()}});
  expect((await changed.json()).ok).toBe(false);expect(await db.property.count({where:{orgId:org.id,name:"Changed without revalidation"}})).toBe(0);
  const commitInput={...importInput,mode:"commit",validationToken:previewBody.validationToken,confirmImport:"yes",submissionId:randomUUID()};
  const imported=await request.post("/api/mobile/imports",{headers,data:commitInput});expect(imported.status(),await imported.text()).toBe(200);expect((await imported.json()).created).toBe(1);
  await request.post("/api/mobile/imports",{headers,data:commitInput});expect(await db.property.count({where:{orgId:org.id,name:"Native imported property"}})).toBe(1);
  const date=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Nairobi"}).format(now);
  await action("collection.assign",{assigneeId:staff.id,date,note:"Call tenant to discuss rent payment"});
  await action("collection.promise",{leaseId:lease.id,assigneeId:staff.id,amount:"500",dueDate:date,followUpDate:date,notes:"Tenant agreed to pay this afternoon"});
  await action("collection.remind",{channel:"IN_APP",approved:"on"});
  expect(await db.notification.count({where:{orgId:org.id,type:"RENT_OVERDUE_REMINDER",status:"SENT"}})).toBe(1);
  const denied=await request.get(`/api/mobile/workspace/action?${new URLSearchParams({...base,actionId:"collection.assign",recordId:foreign.id})}`,{headers});expect(denied.status()).toBe(403);
  const {PRODUCT_UPDATES_DISMISSED_ID}=await import("../../apps/web/src/features/updates/catalog");
  await db.productUpdateRead.create({data:{userId:staff.id,updateId:PRODUCT_UPDATES_DISMISSED_ID}});
  await context.addCookies([{name,value:token,url:productionBackend?baseURL!.replace(/^http:/,"https:"):baseURL!,httpOnly:true,secure:productionBackend}]);await page.setViewportSize({width:320,height:800});
  await page.goto(path);await expect(page.getByRole("heading",{name:"Collections today",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Native collection tenant",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.getByRole("link",{name:"Rent statement",exact:true}).click();await expect(page).toHaveURL(/collections\/statement\//,{timeout:30000});await expect(page.getByRole("heading",{name:/Rent statement/})).toBeVisible({timeout:30000});
  await action("collection.resolvePromise",{id:(await db.collectionPromise.findFirstOrThrow({where:{orgId:org.id}})).id,status:"CANCELLED",note:"Customer requested a new agreement"});
  await action("collection.complete",{});
  expect(await db.crmActivity.count({where:{scopeOrgId:org.id,subject:"Rent collection follow-up",completedAt:null}})).toBe(0);
 }finally{
  const orgIds=[org.id,foreignOrg.id];await db.auditLog.deleteMany({where:{orgId:{in:orgIds}}});await db.workflowSubmission.deleteMany({where:{actorUserId:{in:users.map(u=>u.id)}}});await db.rateLimitBucket.deleteMany({where:{key:{contains:staff.id}}});await db.organization.deleteMany({where:{id:{in:orgIds}}});await db.user.deleteMany({where:{id:{in:users.map(u=>u.id)}}});await db.$disconnect();
 }
});
