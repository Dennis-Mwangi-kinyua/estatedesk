import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import vm from "node:vm";
import path from "node:path";

async function harness(role = "ADMIN", authorized = true, updateError?: { code: string }, grantedPermissions: string[] = []) {
  const updates: unknown[] = [], audits: unknown[] = [], reads: unknown[] = [], paths: unknown[] = [];
  const h = {
    prisma: { organization: {
      findUnique: async (args: unknown) => { reads.push(args); return { id: "org-1", name: "Old Name", slug: "existing-address", deletedAt: null }; },
      update: async (args: unknown) => { if (updateError) throw updateError; updates.push(args); },
    } },
    requirePlatformRole: async () => { if (!authorized) throw new Error("Forbidden"); return { userId: "admin-1" }; },
    requireUserSession: async () => ({ userId: "member-1", activeOrgRole: role, grantedPermissions }),
    requireCurrentOrgId: async () => "org-1",
    requireOrgAccess: async () => ({ role }),
    writeAuditLog: async (args: unknown) => { audits.push(args); },
    redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
    roleHasOrgPermission: (value: string) => value === "ADMIN",
    revalidatePath: (...args: unknown[]) => { paths.push(args); },
  };
  const bundle = await build({entryPoints:[path.resolve("apps/web/src/features/organizations/actions/update-organization-slug.ts")],bundle:true,write:false,format:"cjs",platform:"node",tsconfig:"apps/web/tsconfig.json",plugins:[{name:"dependencies",setup(builder){
    builder.onResolve({filter:/^(next\/(cache|navigation)|@\/lib\/)/},args=>args.path.endsWith("role-matrix") ? undefined : ({path:args.path,namespace:"mock"}));
    builder.onLoad({filter:/.*/,namespace:"mock"},args=>({contents:args.path.endsWith("prisma")?'export const prisma=globalThis.h.prisma;':args.path === "next/navigation"?'export const redirect=globalThis.h.redirect;':args.path.endsWith("role-matrix")?'export const roleHasOrgPermission=globalThis.h.roleHasOrgPermission;':args.path.endsWith("guards")?'export const requirePlatformRole=globalThis.h.requirePlatformRole;':args.path.endsWith("session")?'export const requireUserSession=globalThis.h.requireUserSession;':args.path.endsWith("auth/org")?'export const requireOrgAccess=globalThis.h.requireOrgAccess; export const requireCurrentOrgId=globalThis.h.requireCurrentOrgId;':args.path==="next/cache"?'export const revalidatePath=globalThis.h.revalidatePath;':'export const writeAuditLog=globalThis.h.writeAuditLog;',loader:"js"}));
  }}]});
  const module={exports:{}};
  vm.runInNewContext(bundle.outputFiles[0].text,{module,exports:module.exports,h});
  const actions=module.exports as {updatePlatformOrganizationSlugAction:(state:unknown,data:FormData)=>Promise<{status:string;name?:string}>;updateCurrentOrganizationSlugAction:(state:unknown,data:FormData)=>Promise<{status:string}>};
  return { ...actions, updates, audits, reads, paths };
}
function form(name:string) { const data=new FormData();data.set("orgId","org-1");data.set("organizationSlug",name);return data; }


test("admin slug changes target the active organisation and audit the old address", async () => {
 const h=await harness(); const data=form("  new-address  "); data.set("orgId","forged-org");
 assert.equal((await h.updateCurrentOrganizationSlugAction({},data)).status,"success");
 assert.equal(JSON.stringify(h.updates),JSON.stringify([{where:{id:"org-1",deletedAt:null},data:{slug:"new-address"}}]));
 assert.equal(h.audits.length,1);
 assert.ok(h.paths.some(p=>JSON.stringify(p)===JSON.stringify(["/platform/organizations/existing-address"])));
});
test("invalid slugs never reach the database",async()=>{
 const h=await harness();for(const slug of ["", "a", "UPPER", "with space", "../path", "-start", "end-", "two--hyphens", "x".repeat(101)]) assert.equal((await h.updateCurrentOrganizationSlugAction({},form(slug))).status,"error");
 assert.equal(h.reads.length,0);
});
test("non-admin organisation roles and unauthorized platform users cannot edit slugs",async()=>{
 for(const role of ["MANAGER","OFFICE","ACCOUNTANT","CARETAKER","TENANT","LANDLORD"]){const h=await harness(role);await assert.rejects(h.updateCurrentOrganizationSlugAction({},form("new-address")),/Forbidden/);assert.equal(h.updates.length,0);}
 const h=await harness("ADMIN",false);await assert.rejects(h.updatePlatformOrganizationSlugAction({},form("new-address")),/Forbidden/);
});
test("platform edits redirect to the new slug",async()=>{
 const h=await harness();await assert.rejects(h.updatePlatformOrganizationSlugAction({},form("new-address")),/REDIRECT:\/platform\/organizations\/new-address/);assert.equal(h.updates.length,1);
});

test("duplicate slugs return a recoverable error without audit or redirect", async () => {
 const h=await harness("ADMIN",true,{code:"P2002"});
 assert.equal((await h.updatePlatformOrganizationSlugAction({},form("taken-slug"))).status,"error");
 assert.equal(h.audits.length,0);assert.equal(h.paths.length,0);
});


test("an office worker with an explicit settings mandate can edit the active organisation slug", async () => {
 const h = await harness("OFFICE", true, undefined, ["org.settings.manage"]);
 assert.equal((await h.updateCurrentOrganizationSlugAction({}, form("delegated-address"))).status, "success");
 assert.equal(h.updates.length, 1);
});
