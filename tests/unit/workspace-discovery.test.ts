import assert from "node:assert/strict";
import {it} from "node:test";
import {canDiscoverWorkspaceHref, ORG_WORKSPACE_ROLES} from "../../apps/web/src/lib/permissions/workspace-access";
import type {OrgRole} from "@prisma/client";
it("navigation discovery follows the role policy for every protected section",()=>{
  for(const role of ["ADMIN","MANAGER","OFFICE","ACCOUNTANT","TENANT","CARETAKER","LANDLORD"] as OrgRole[]){const access={platformRole:"USER" as const,activeOrgRole:role,activeOrgId:"org"};for(const [section,allowed] of Object.entries(ORG_WORKSPACE_ROLES)){assert.equal(canDiscoverWorkspaceHref(access,`/dashboard/org/${section}?q=search`),allowed.includes(role),`${role} ${section}`);}}
});
it("public links remain available and super-admin destinations stay undiscoverable",()=>{
  const access={platformRole:"PLATFORM_ADMIN" as const,activeOrgRole:null,activeOrgId:null};
  assert.equal(canDiscoverWorkspaceHref(access,"/platform/control"),false);
  assert.equal(canDiscoverWorkspaceHref(access,"/platform/organizations"),true);
  for(const href of ["/pricing","/contact","/login","#section","https://example.test"]){assert.equal(canDiscoverWorkspaceHref(access,href),true);}
});

it("hides blocked pages from navigation and timeline destinations even for organization administrators", () => {
  const access = { platformRole: "USER" as const, activeOrgRole: "ADMIN" as const, activeOrgId: "org", orgRolePolicy: { blockedViews: ["payments", "leases"] as ("payments" | "leases")[], permissions: {} } };
  for (const href of ["/dashboard/org/payments", "/dashboard/org/payments?tab=history", "/dashboard/org/leases/lease-one", "/platform/audit-logs"]) assert.equal(canDiscoverWorkspaceHref(access, href), false);
  assert.equal(canDiscoverWorkspaceHref(access, "/dashboard/org/tenants"), true);
});
