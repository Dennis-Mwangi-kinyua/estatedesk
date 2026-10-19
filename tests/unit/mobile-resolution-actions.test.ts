import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";

test("native completion reviews enforce role, scope, reviewed version and persisted outcome", async () => {
  const fixture = { calls: [] as any[], saved: false, row: { issueId: "issue-owned", workSummary: "Fixture work", updatedAt: new Date("2026-10-19T08:00:00Z") }, writes: 0, persist: true };
  (globalThis as any).__resolutionFixture = fixture;
  const mocks: Record<string, string> = {
    "server-only": "",
    "@/lib/prisma": `export const prisma={issueResolutionReport:{findFirst:async args=>{const f=globalThis.__resolutionFixture;f.calls.push(args);return args.select.id?(f.saved?{id:'report-owned'}:null):f.row}}};`,
    "@/app/(app)/dashboard/org/issues/actions": `async function review(){const f=globalThis.__resolutionFixture;f.writes++;f.saved=f.persist;throw new Error('NEXT_REDIRECT')}export const approveIssueResolutionReportAction=review;export const rejectIssueResolutionReportAction=review;`,
    "next/dist/client/components/redirect-error": `export const isRedirectError=e=>e.message==='NEXT_REDIRECT';`,
  };
  const bundle = await build({ entryPoints: ["apps/web/src/lib/mobile/native-resolution-actions.ts"], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "resolution-fixtures", setup(builder) {
    builder.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: "fixture" } : undefined);
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "js" }));
  } }] });
  const compiled = { exports: {} as any };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
  const { nativeResolutionDefinition: definition, executeNativeResolutionAction: execute, nativeResolutionActions: actions } = compiled.exports;
  const session = { userId: "reviewer", activeOrgId: "org-owned", activeOrgRole: "OFFICE", membershipScope: { scopeType: "UNIT", scopeId: "unit-owned" } };
  const path = "/dashboard/org/issues/resolution-reports";
  try {
    for (const role of ["TENANT", "CARETAKER", "ACCOUNTANT", "SECURITY"]) assert.equal(await definition({ ...session, activeOrgRole: role }, path, "resolution.approve", "report-owned"), null);
    assert.equal(fixture.calls.length, 0);
    assert.equal(await definition(session, "/platform/organizations", "resolution.approve", "report-owned"), null);
    assert.equal(await definition(session, path, "resolution.delete", "report-owned"), null);
    assert.deepEqual(actions("REJECTED"), []);
    const formDefinition = await definition(session, path, "resolution.reject", "report-owned");
    assert.equal(formDefinition.groups[0].fields.find((field: any) => field.name === "officeNotes").required, true);
    const where = fixture.calls.at(-1).where;
    assert.equal(where.orgId, "org-owned"); assert.equal(where.status, "SUBMITTED");
    assert.equal(where.issue.unit.id, "unit-owned");
    const form = new FormData(); form.set("issueId", "issue-owned"); form.set("expectedUpdatedAt", "old-version");
    await assert.rejects(() => execute(session, path, "resolution.approve", "report-owned", form), /changed/);
    assert.equal(fixture.writes, 0);
    form.set("expectedUpdatedAt", fixture.row.updatedAt.toISOString());
    const result = await execute(session, path, "resolution.approve", "report-owned", form);
    assert.equal(result.ok, true);
    assert.equal(form.get("reportId"), "report-owned");
    assert.equal(fixture.calls.at(-1).where.officeReviewedByUserId, "reviewer");
    assert.equal(fixture.calls.at(-1).where.status, "OFFICE_APPROVED");
    fixture.saved = false; fixture.persist = false;
    await assert.rejects(() => execute(session, path, "resolution.approve", "report-owned", form), /not saved/);
  } finally { delete (globalThis as any).__resolutionFixture; }
});
