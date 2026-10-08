import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import vm from "node:vm";
import path from "node:path";

async function harness(role = "ADMIN", authorized = true) {
  const updates: unknown[] = [], audits: unknown[] = [], reads: unknown[] = [], paths: unknown[] = [];
  const h = {
    prisma: { organization: {
      findUnique: async (args: unknown) => { reads.push(args); return { id: "org-1", name: "Old Name", slug: "existing-address", deletedAt: null }; },
      update: async (args: unknown) => { updates.push(args); },
    } },
    requirePlatformRole: async () => { if (!authorized) throw new Error("Forbidden"); return { userId: "admin-1" }; },
    requireUserSession: async () => ({ userId: "member-1" }),
    requireCurrentOrgId: async () => "org-1",
    requireOrgAccess: async () => ({ role }),
    writeAuditLog: async (args: unknown) => { audits.push(args); },
    revalidatePath: (...args: unknown[]) => { paths.push(args); },
  };
  const bundle = await build({entryPoints:[path.resolve("apps/web/src/features/organizations/actions/rename-organization.ts")],bundle:true,write:false,format:"cjs",platform:"node",tsconfig:"apps/web/tsconfig.json",plugins:[{name:"dependencies",setup(builder){
    builder.onResolve({filter:/^(next\/cache|@\/lib\/)/},args=>({path:args.path,namespace:"mock"}));
    builder.onLoad({filter:/.*/,namespace:"mock"},args=>({contents:args.path.endsWith("prisma")?'export const prisma=globalThis.h.prisma;':args.path.endsWith("guards")?'export const requirePlatformRole=globalThis.h.requirePlatformRole;':args.path.endsWith("session")?'export const requireUserSession=globalThis.h.requireUserSession;':args.path.endsWith("auth/org")?'export const requireOrgAccess=globalThis.h.requireOrgAccess; export const requireCurrentOrgId=globalThis.h.requireCurrentOrgId;':args.path==="next/cache"?'export const revalidatePath=globalThis.h.revalidatePath;':'export const writeAuditLog=globalThis.h.writeAuditLog;',loader:"js"}));
  }}]});
  const module={exports:{}};
  vm.runInNewContext(bundle.outputFiles[0].text,{module,exports:module.exports,h});
  const actions=module.exports as {renamePlatformOrganizationAction:(state:unknown,data:FormData)=>Promise<{status:string;name?:string}>;renameCurrentOrganizationAction:(state:unknown,data:FormData)=>Promise<{status:string}>};
  return { ...actions, updates, audits, reads, paths };
}
function form(name:string) { const data=new FormData();data.set("orgId","org-1");data.set("organizationName",name);return data; }

test("platform rename trims the name and updates only the name while auditing and refreshing displays",async()=>{
 const h=await harness();const result=await h.renamePlatformOrganizationAction({},form("  New Name  "));
 assert.equal(result.status,"success");assert.equal(result.name,"New Name");
 assert.equal(JSON.stringify(h.updates),JSON.stringify([{where:{id:"org-1",deletedAt:null},data:{name:"New Name"}}]));
 assert.equal(h.audits.length,1);assert.ok(h.paths.some(p=>JSON.stringify(p)===JSON.stringify(["/","layout"])));
});
test("invalid names cannot reach the database",async()=>{
 const h=await harness();for(const name of [" ","A","x".repeat(201)])assert.equal((await h.renamePlatformOrganizationAction({},form(name))).status,"error");
 assert.equal(h.reads.length,0);assert.equal(h.updates.length,0);
});
test("platform and organisation permissions prevent unauthorized renames",async()=>{
 const platform=await harness("ADMIN",false);await assert.rejects(platform.renamePlatformOrganizationAction({},form("Name")),/Forbidden/);assert.equal(platform.updates.length,0);
 const tenant=await harness("TENANT");await assert.rejects(tenant.renameCurrentOrganizationAction({},form("Name")),/Forbidden/);assert.equal(tenant.updates.length,0);
});
test("organisation members can rename only the active organisation",async()=>{
 const h=await harness("MANAGER");const data=form("New Name");data.set("orgId","forged-other-org");
 assert.equal((await h.renameCurrentOrganizationAction({},data)).status,"success");
 assert.equal(JSON.stringify(h.reads),JSON.stringify([{where:{id:"org-1"},select:{id:true,name:true,slug:true,deletedAt:true}}]));
});
