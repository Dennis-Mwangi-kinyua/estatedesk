import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { caretakerAssignmentTargets } from "../../apps/web/src/lib/caretaker/scope-targets";
import { caretakerCanAccessPath, caretakerWorkspaceSections } from "../../apps/web/src/lib/caretaker/workspace-policy";
import { caretakerCanStartIssue, caretakerCanUpdateIssue, caretakerCanCompleteInspection } from "../../apps/web/src/lib/caretaker/issue-actions";
import { canAccessWorkspacePath, canDiscoverWorkspaceHref } from "../../apps/web/src/lib/permissions/workspace-access";

const session = { platformRole: "USER" as const, activeOrgRole: "CARETAKER" as const, activeOrgId: "org" };
describe("caretaker workspace scope", () => {
  it("uses a unit or building assignment without promoting its parent property to a grant", () => {
    assert.deepEqual(caretakerAssignmentTargets([{ propertyId: "property", buildingId: "building", unitId: "unit" }]), { propertyIds: [], buildingIds: [], unitIds: ["unit"] });
    assert.deepEqual(caretakerAssignmentTargets([{ propertyId: "property", buildingId: "building", unitId: null }]), { propertyIds: [], buildingIds: ["building"], unitIds: [] });
  });
  it("combines independent assignments while preserving their intended levels", () => {
    assert.deepEqual(caretakerAssignmentTargets([{ propertyId: "property", buildingId: "building", unitId: null }, { propertyId: "other-property", buildingId: null, unitId: null }]), { propertyIds: ["other-property"], buildingIds: ["building"], unitIds: [] });
  });
  it("keeps personal pages available without exposing unassigned work areas", () => {
    const sections = caretakerWorkspaceSections({ hasUnits: false, hasIssues: false, hasInspections: false });
    for (const path of ["", "/profile", "/security", "/help", "/notifications", "/today"]) assert.ok(caretakerCanAccessPath(`/dashboard/caretaker${path}`, sections));
    for (const path of ["/units", "/tenants", "/leases", "/water-bills", "/vendors", "/issues/new", "/finance-requests"]) assert.equal(caretakerCanAccessPath(`/dashboard/caretaker${path}`, sections), false);
  });
  it("a directly assigned issue opens its workflow without granting unrelated unit access", () => {
    const sections = caretakerWorkspaceSections({ hasUnits: false, hasIssues: true, hasInspections: false });
    assert.ok(caretakerCanAccessPath("/dashboard/caretaker/issues/assigned-issue", sections));
    assert.ok(caretakerCanAccessPath("/dashboard/caretaker/vendors", sections));
    assert.equal(caretakerCanAccessPath("/dashboard/caretaker/issues/new", sections), false);
    assert.equal(caretakerCanAccessPath("/dashboard/caretaker/units", sections), false);
  });
  it("direct inspection allocation does not expose tenant directories or issue creation", () => {
    const sections = caretakerWorkspaceSections({ hasUnits: false, hasIssues: false, hasInspections: true });
    assert.ok(caretakerCanAccessPath("/dashboard/caretaker/inspections/task", sections));
    assert.equal(caretakerCanAccessPath("/dashboard/caretaker/tenants", sections), false);
    assert.equal(caretakerCanAccessPath("/dashboard/caretaker/issues/new", sections), false);
  });
  it("uses the same scope policy for navigation and route authorization, rejecting unknown pages", () => {
    const caretakerSections = caretakerWorkspaceSections({ hasUnits: true, hasIssues: false, hasInspections: false });
    for (const href of ["/dashboard/caretaker/units", "/dashboard/caretaker/water-bills/read", "/dashboard/caretaker/issues/new"]) {
      assert.ok(canDiscoverWorkspaceHref({ ...session, caretakerSections }, href));
      assert.ok(canAccessWorkspacePath({ ...session, caretakerSections }, href));
    }
    for (const href of ["/dashboard/caretaker/settings", "/dashboard/caretaker/staff", "/dashboard/org/payments", "/dashboard/tenant"]) assert.equal(canDiscoverWorkspaceHref({ ...session, caretakerSections }, href), false);
    assert.equal(canAccessWorkspacePath(session, "/dashboard/caretaker/unknown"), false);
  });
  it("hides unit-profile links outside the allowed records even when the unit directory is permitted", () => {
    const access = { ...session, caretakerUnitPaths: ["/dashboard/caretaker/units/assigned"] };
    assert.ok(canDiscoverWorkspaceHref(access, "/dashboard/caretaker/units/assigned"));
    assert.equal(canDiscoverWorkspaceHref(access, "/dashboard/caretaker/units/elsewhere"), false);
  });
  it("never offers or authorises work updates for somebody else's assigned ticket", () => {
    assert.ok(caretakerCanStartIssue({ status: "OPEN", assignedToUserId: null }, "self"));
    assert.equal(caretakerCanStartIssue({ status: "OPEN", assignedToUserId: "other" }, "self"), false);
    assert.equal(caretakerCanUpdateIssue({ status: "IN_PROGRESS", assignedToUserId: "other" }, "self"), false);
    assert.ok(caretakerCanUpdateIssue({ status: "IN_PROGRESS", assignedToUserId: "self" }, "self"));
    assert.equal(caretakerCanUpdateIssue({ status: "CLOSED", assignedToUserId: "self" }, "self"), false);
  });
  it("only allows the named inspector to complete a scheduled inspection", () => {
    assert.ok(caretakerCanCompleteInspection({ status: "SCHEDULED", inspectorUserId: "self" }, "self"));
    assert.equal(caretakerCanCompleteInspection({ status: "SCHEDULED", inspectorUserId: "other" }, "self"), false);
    assert.equal(caretakerCanCompleteInspection({ status: "COMPLETED", inspectorUserId: "self" }, "self"), false);
  });
});

it("server actions reject another caretaker's ticket before any write or notification", async () => {
  const { build } = await import("esbuild");
  const { createRequire } = await import("node:module");
  const path = await import("node:path");
  const fixture = { transactions: 0, issue: { id: "ticket", status: "OPEN", assignedToUserId: "other", orgId: "org", resolutionNotes: null } };
  const globals = globalThis as typeof globalThis & { caretakerActionFixture?: typeof fixture };
  globals.caretakerActionFixture = fixture;
  const mocks: Record<string, string> = {
    "@/lib/prisma": "export const prisma = { $transaction: async () => { globalThis.caretakerActionFixture.transactions++; throw new Error('Unexpected write'); } };",
    "@/lib/permissions/guards": "export const requireCaretakerAccess = async () => ({ userId: 'self', activeOrgId: 'org', activeOrgRole: 'CARETAKER', membershipScope: null });",
    "@/app/(app)/dashboard/caretaker/_lib/paths": "export const getCaretakerIssueHref = id => '/dashboard/caretaker/issues/' + id;",
    "@/lib/notifications/notify": "export const notifyInAppAndPush = async () => { throw new Error('Unexpected notification'); };",
    "@/features/issues/actions/upload-completion-photo": "export const uploadCompletionPhoto = async () => { throw new Error('Unexpected upload'); };",
    "./_lib/access": "export const getCaretakerManageableIssue = async () => globalThis.caretakerActionFixture.issue;",
    "next/navigation": "export const redirect = href => { throw new Error('REDIRECT:' + href); };",
    "next/cache": "export const revalidatePath = () => {};",
  };
  try {
    const bundle = await build({ entryPoints: [path.resolve("apps/web/src/app/(app)/dashboard/caretaker/issues/actions.ts")], bundle: true, write: false, format: "cjs", platform: "node", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "caretaker-boundary", setup(builder) {
      builder.onResolve({ filter: /.*/ }, args => mocks[args.path] ? { path: args.path, namespace: "fixture" } : undefined);
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "js" }));
    } }] });
    const module = { exports: {} as { startCaretakerIssueAction: (form: FormData) => Promise<void>; addCaretakerIssueProgressNoteAction: (form: FormData) => Promise<void> } };
    new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(path.resolve("package.json")), module, module.exports);
    const form = new FormData(); form.set("issueId", "ticket"); form.set("progressNote", "Trying to change someone else's work");
    await assert.rejects(module.exports.startCaretakerIssueAction(form), /REDIRECT:/);
    fixture.issue.status = "IN_PROGRESS";
    await assert.rejects(module.exports.addCaretakerIssueProgressNoteAction(form), /REDIRECT:/);
    assert.equal(fixture.transactions, 0);
  } finally { delete globals.caretakerActionFixture; }
});
