import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { configureTestDatabase } from "./database-safety";
const databaseUrl=configureTestDatabase();
test("CSV preview detects duplicate records and missing or occupied units before any writes",{skip:!databaseUrl},async()=>{
 const {prisma}=await import("../../apps/web/src/lib/prisma");
 const {importCsv}=await import("../../apps/web/src/lib/imports/csv-import");
 const tag=randomUUID();const now=new Date();
 const org=await prisma.organization.create({data:{name:`Import ${tag}`,slug:`import-${tag}`,subscription:{create:{plan:"FREE",status:"ACTIVE",currentPeriodStart:now,currentPeriodEnd:new Date(now.getTime()+365*86400000)}}}});
 try{
  const property=await prisma.property.create({data:{orgId:org.id,name:"Imported property"}});
  await prisma.unit.create({data:{propertyId:property.id,houseNo:"A1",rentAmount:1000,status:"VACANT"}});
  let result=await importCsv({orgId:org.id,kind:"properties",csv:"name\nImported property",dryRun:true});assert.equal(result.ok,false);assert.match(result.errors.join(" "),/already exists/);
  result=await importCsv({orgId:org.id,kind:"tenants",csv:"fullName,phone,propertyName,unitHouseNo\nJane,0700000000,Imported property,Missing",dryRun:true});assert.equal(result.ok,false);assert.match(result.errors.join(" "),/unit not found/);
  assert.equal(await prisma.tenant.count({where:{orgId:org.id}}),0);
  const csv="fullName,phone,propertyName,unitHouseNo,startDate,monthlyRent,dueDay\nJane,0700000000,Imported property,A1,2026-11-01,1000,5";
  const duplicated=csv+"\nAli,0700000001,Imported property,A1,2026-11-01,1000,5";
  result=await importCsv({orgId:org.id,kind:"tenants",csv:duplicated,dryRun:true});assert.equal(result.ok,false);assert.match(result.errors.join(" "),/another row already allocates/);assert.equal(result.validRows,1);
  result=await importCsv({orgId:org.id,kind:"tenants",csv,dryRun:true});assert.equal(result.ok,true);assert.equal(await prisma.tenant.count({where:{orgId:org.id}}),0);
  result=await importCsv({orgId:org.id,kind:"tenants",csv,dryRun:false});assert.equal(result.created,1);assert.equal(await prisma.lease.count({where:{orgId:org.id,status:"ACTIVE"}}),1);
  result=await importCsv({orgId:org.id,kind:"tenants",csv,dryRun:true});assert.equal(result.ok,false);assert.match(result.errors.join(" "),/already exists|not available/);
  assert.equal(await prisma.tenant.count({where:{orgId:org.id}}),1);
  const many="name\n"+Array.from({length:501},(_,i)=>`Property ${i}`).join("\n");
  await assert.rejects(importCsv({orgId:org.id,kind:"properties",csv:many,dryRun:false}),/more than 500/);
  assert.equal(await prisma.property.count({where:{orgId:org.id}}),1);
 }finally{await prisma.organization.delete({where:{id:org.id}});await prisma.$disconnect();}
});
