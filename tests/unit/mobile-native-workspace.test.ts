import { adminNavItems, developerNavItems } from "../../apps/web/src/app/(app)/platform/_lib/nav";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { nativeWorkspaceEntry, nativeUnitScope, nativeOrgWideAccess } from "../../apps/web/src/lib/mobile/native-workspace-policy";
import { nativeWorkspaceQuerySchema, nativeWorkspacePageSchema } from "../../packages/contracts/src/mobile";
import { canAccessWorkspacePath } from "../../apps/web/src/lib/permissions/workspace-access";

test("native workspace entry cannot turn a menu entry into an arbitrary resource path", () => {
  const links = [{ path: "/dashboard/org/tenants" }];
  assert.equal(nativeWorkspaceEntry(links, "/dashboard/org/tenants"), links[0]);
  for (const path of ["/platform/users", "/dashboard/org/tenants/other", "/dashboard/org/tenants?orgId=other", "https://example.test", "//example.test", "/dashboard/org/tenants/../settings"]) assert.equal(nativeWorkspaceEntry(links, path), null);
  for (const change of [{ page: 0 }, { page: 1.5 }, { page: 10001 }, { q: "x".repeat(101) }, { kind: "tenant" }]) assert.equal(nativeWorkspaceQuerySchema.safeParse({ kind: "organization", path: links[0].path, ...change }).success, false);
});

test("native record scopes retain organization and property/building/unit restrictions", () => {
  for (const [scopeType, filter] of [["PROPERTY", { propertyId: "assigned" }], ["BUILDING", { buildingId: "assigned" }], ["UNIT", { id: "assigned" }]] as const) {
    assert.deepEqual(nativeUnitScope("org", { scopeType, scopeId: "assigned" }), { deletedAt: null, property: { orgId: "org", deletedAt: null }, ...filter });
    assert.equal(nativeOrgWideAccess({ scopeType, scopeId: "assigned" }), false);
  }
  assert.deepEqual(nativeUnitScope("org", { scopeType: "UNKNOWN", scopeId: "assigned" }).id, { in: [] });
  assert.equal(nativeOrgWideAccess({ scopeType: "UNKNOWN", scopeId: "assigned" }), false);
});

test("native tools retain web role, blocked section and super-admin restrictions", () => {
  const session = { platformRole: "USER" as const, activeOrgId: "org", activeOrgRole: "OFFICE" as const };
  assert.equal(canAccessWorkspacePath(session, "/dashboard/org/tenants"), true);
  assert.equal(canAccessWorkspacePath({ ...session, orgRolePolicy: { blockedViews: ["tenants"], permissions: {} } }, "/dashboard/org/tenants"), false);
  assert.equal(canAccessWorkspacePath(session, "/platform/users"), false);
  assert.equal(canAccessWorkspacePath({ ...session, platformRole: "PLATFORM_ADMIN" }, "/platform/control"), false);
  assert.equal(canAccessWorkspacePath({ ...session, platformRole: "SUPER_ADMIN" }, "/platform/control"), true);
});

test("native record queries are bounded, scoped, and never serialize private columns", async () => {
  const fixture = { calls: [] as { model: string; args: Record<string, unknown> }[], rows: [] as unknown[] };
  const globalFixture = globalThis as typeof globalThis & { __nativeWorkspaceTest?: typeof fixture };
  globalFixture.__nativeWorkspaceTest = fixture;
  const bundle = await build({ entryPoints: ["apps/web/src/lib/mobile/native-workspace-records.ts"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json",
    plugins: [{ name: "workspace-fixtures", setup(builder) {
      const mocks: Record<string, string> = {
        "server-only": "",
        "@/lib/prisma": `export const prisma = new Proxy({}, {get(_,model){return {
          findMany:async args=>{const f=globalThis.__nativeWorkspaceTest;f.calls.push({model,args});return f.rows;},
          findUnique:async()=>null, count:async()=>0, groupBy:async()=>[]
        }}});`,
        "@/lib/ops/production-readiness": "export const getProductionReadinessReport=async()=>({checks:[]});",
        "@/features/identity/service": "export const identityOwners=async()=>[];",
        "@/lib/guides": "export const guideArticles=[];",
        "@/lib/help/in-app-guides": "export const canAccessGuideSlug=()=>false;",
        "@/lib/config/env": "export const getRuntimeEnvReport=()=>({checks:[]});",
        "@/lib/integrations": "export const getIntegrationReadinessReport=()=>({integrations:[]});",
        "@/app/(app)/platform/api-keys/actions": "export const isPlatformApiKeysUnlocked=async()=>false;",
      };
      builder.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: "fixture" } : undefined);
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "js" }));
    } }],
  });
  const compiled = { exports: {} as { nativeWorkspaceRecords: (...args: unknown[]) => Promise<{ records: unknown[]; notice?: string }> } };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
  const read = compiled.exports.nativeWorkspaceRecords;
  const session = { activeOrgId: "org", userId: "user", activeOrgRole: "ADMIN", membershipScope: { scopeType: "UNIT", scopeId: "unit" } };
  try {
    fixture.rows = [{ id: "tenant", fullName: "Example Tenant", phone: "fixture", email: null, status: "ACTIVE", type: "INDIVIDUAL", nationalId: "SECRET-ID", passwordHash: "SECRET-HASH" }];
    const result = await read(session, "organization", "/dashboard/org/tenants", "Example", 2);
    assert.equal(fixture.calls[0].model, "tenant");
    assert.equal(fixture.calls[0].args.skip, 25);
    assert.equal(fixture.calls[0].args.take, 26);
    assert.match(JSON.stringify(fixture.calls[0].args.where), /"orgId":"org"/);
    assert.match(JSON.stringify(fixture.calls[0].args.where), /"id":"unit"/);
    assert.ok(!JSON.stringify(result).includes("SECRET"));
    assert.ok(nativeWorkspacePageSchema.safeParse({ title: "Tenants", description: "Records", emoji: "👥", page: 2, hasMore: false, records: result.records, related: [] }).success);
    fixture.calls.length = 0;
    const denied = await read(session, "organization", "/dashboard/org/accounting", "", 1);
    assert.equal(fixture.calls.length, 0);
    assert.deepEqual(denied.records, []);
    assert.match(denied.notice!, /scope/);
    const vault = await read(session, "platform", "/platform/api-keys", "", 1);
    assert.match(vault.notice!, /locked/);
    assert.equal(fixture.calls.length, 0);
    fixture.rows = [{ id: "org", name: "Example Organization", status: "ACTIVE", email: "contact@example.test", phone: "fixture", slug: "example", address: "Nairobi", currencyCode: "KES", timezone: "Africa/Nairobi", createdAt: new Date("2026-10-01"), subscription: { plan: "FREE", status: "ACTIVE", currentPeriodEnd: new Date("2026-11-01") }, documentRecords: [{ id: "agreement-target" }], _count: { properties: 2, tenants: 8, memberships: 3 } }];
    const organization = await read(session, "platform", "/platform/organizations", "", 1);
    const fields = (organization.records[0] as { fields: { label: string; value: string }[] }).fields;
    assert.equal(fields.find(field => field.label === "Properties")?.value, "2");
    assert.equal(fields.find(field => field.label === "Plan")?.value, "FREE");
    assert.equal(fields.find(field => field.label === "Timezone")?.value, "Africa/Nairobi");
    const organizationSelect = fixture.calls.at(-1)!.args.select as Record<string, unknown>;
    assert.ok(organizationSelect._count);
    assert.deepEqual((organization.records[0] as { links: unknown[] }).links, [{ title: "DPA agreement", path: "/platform/agreements", recordId: "agreement-target", emoji: "🤝", description: "Review service terms, signatures and agreement actions." }]);
    const documents = organizationSelect.documentRecords as { where: { entityType: string }; take: number };
    assert.equal(documents.take, 1);
    assert.ok(documents.where.entityType);
    fixture.rows = [];
    await read({ ...session, membershipScope: { scopeType: "ORG", scopeId: "org" } }, "organization", "/dashboard/org/agreements", "", 1, "agreement-target");
    assert.equal((fixture.calls.at(-1)!.args.where as { id: string; orgId: string }).id, "agreement-target");
    assert.equal((fixture.calls.at(-1)!.args.where as { orgId: string }).orgId, "org");
    const beforeUnsupportedDetail = fixture.calls.length;
    await read(session, "organization", "/dashboard/org/tenants", "", 1, "foreign-record");
    assert.equal(fixture.calls.length, beforeUnsupportedDetail);
    assert.equal(organizationSelect.passwordHash, undefined);
    fixture.rows = [];
    for (const path of ["/platform/users", "/platform/admins"]) {
      await read({ ...session, platformRole: "SUPER_ADMIN" }, "platform", path, "", 1);
      const query = fixture.calls.at(-1)!;
      assert.equal(query.model, "user");
      // Prisma requires one field per orderBy entry, including the pagination tie-breaker.
      assert.deepEqual(query.args.orderBy, [{ createdAt: "desc" }, { id: "desc" }]);
    }
    const paths = [...new Set([...adminNavItems, ...developerNavItems].map(link => link.href))].filter(path => !["/platform", "/platform/developer"].includes(path));
    paths.push("/platform/service-providers/reports", "/platform/jobs/notifications");
    for (const path of paths) {
      const page = await read({ ...session, platformRole: "SUPER_ADMIN" }, "platform", path, "", 1);
      assert.doesNotMatch(page.notice ?? "", /still being built/, `${path} needs a native handler`);
      assert.ok(nativeWorkspacePageSchema.safeParse({ title: path, description: "Native service", emoji: "grid", page: 1, hasMore: false, records: page.records, related: [] }).success, path);
    }
    const organizationSections = ["properties", "buildings", "tenants", "leases", "issues", "issues/resolution-reports", "move-outs", "inspections", "water-bills", "charges", "vacancy-inquiries", "profile", "accounting", "finance-requests", "accounting/requests", "expenditures", "taxes", "staff", "staff/permissions", "community", "reports", "imports", "airbnb", "settings", "payments", "service-providers", "insights", "search", "support", "agreements", "identity-verification", "verify-tenant", "api-keys"];
    for (const section of organizationSections) {
      const path = `/dashboard/org/${section}`;
      const page = await read({ ...session, membershipScope: { scopeType: "ORG", scopeId: "org" } }, "organization", path, "Example", 2);
      assert.doesNotMatch(page.notice ?? "", /still being built/, path);
    }

    // Use the generated Prisma validator, but return empty rows at the adapter
    // boundary: invalid filters, selections and sorting fail without a database.
    const adapter = new PrismaPg({ connectionString: "postgresql://localhost/native-query-validation" });
    const connect = adapter.connect.bind(adapter);
    adapter.connect = async () => {
      const connection = await connect();
      connection.queryRaw = async () => ({ columnNames: [], columnTypes: [], rows: [] });
      return connection;
    };
    const client = new PrismaClient({ adapter });
    try {
      for (const { model, args } of fixture.calls) {
        const delegate = client[model as keyof typeof client] as unknown as { findMany: (args: Record<string, unknown>) => Promise<unknown> };
        await assert.doesNotReject(() => delegate.findMany(args), `${model} query must pass Prisma validation`);
      }
    } finally { await client.$disconnect(); }
  } finally { delete globalFixture.__nativeWorkspaceTest; }
});


test("mobile screens cannot fall back to a website or embedded browser", async () => {
  async function inspect(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await inspect(path);
      else if (/\.tsx?$/.test(path)) {
        const source = await readFile(path, "utf8");
        assert.doesNotMatch(source, /from ["'](?:react-native-webview|expo-web-browser)["']|Linking\.openURL|tenantWorkspaceSource|workspaceSource/, path);
      }
    }
  }
  await inspect("apps/mobile/src");
  const mobilePackage = JSON.parse(await readFile("apps/mobile/package.json", "utf8"));
  assert.equal(mobilePackage.dependencies["react-native-webview"], undefined);
});
