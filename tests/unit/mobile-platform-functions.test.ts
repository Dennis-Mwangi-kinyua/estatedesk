import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { nativeActionDefinitionSchema, nativeActionFormData, nativeActionRequestSchema, nativeActionResultSchema, type NativeActionDefinition, type NativeActionLink } from "../../packages/contracts/src/mobile";

type Fixture = { rows: Record<string, unknown>; access?: unknown; calls: { action: string; values: Record<string, FormDataEntryValue>; subject?: string }[] };
type Module = Record<string, (...args: unknown[]) => unknown>;
async function load(name: string, fixture: Fixture): Promise<Module> {
  (globalThis as typeof globalThis & { __nativeFunctions?: Fixture }).__nativeFunctions = fixture;
  const actions = ["requestIdentityVerification", "reviewIdentityVerification", "linkApprovedIdentity", "moderateProvider", "dismissProviderReport", "updateLeadAttributionAction", "updateOrganizationAttributionAction", "saveOrganizationRoleAccess", "createAgreement", "changeAgreement"];
  const stubs = actions.map(action => `export async function ${action}(...args){const form=args.find(arg=>arg instanceof FormData);globalThis.__nativeFunctions.calls.push({action:'${action}',values:form?Object.fromEntries(form):{},subject:typeof args[0]==='string'?args[0]:undefined});return {ok:true,message:'Saved'};}`).join("\n");
  const bundle = await build({ entryPoints: [`apps/web/src/lib/mobile/${name}.ts`], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", tsconfig: "apps/web/tsconfig.json", plugins: [{ name: "native-function-hosts", setup(builder) {
    const mocks: Record<string, string> = {
      "server-only": "",
      "next/cache": "export const revalidatePath=()=>{};",
      "@/lib/prisma": `export const prisma=new Proxy({}, {get(_,model){return {findFirst:async()=>globalThis.__nativeFunctions.rows[model]??null,findUnique:async()=>globalThis.__nativeFunctions.rows[model]??null,findMany:async()=>globalThis.__nativeFunctions.rows[model]??[]}}});`,
      "@/features/identity/actions": stubs,
      "@/features/providers/actions": stubs,
      "@/app/(app)/platform/marketing/actions": stubs,
      "@/app/(app)/platform/organizations/[slug]/access/actions": stubs,
      "@/lib/service-agreements/service": `${stubs}\nexport const accessibleAgreement=async()=>globalThis.__nativeFunctions.access??null;`,
      "@/app/api/service-agreements/[id]/route": `export const GET=async()=>new Response('fixture-pdf',{headers:{'content-type':'application/pdf'}});`,
    };
    builder.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: "fixture" } : undefined);
    builder.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "js" }));
  } }] });
  const compiled = { exports: {} as Module };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), compiled, compiled.exports);
  return compiled.exports;
}
const session = { userId: "operator", fullName: "Example Operator", email: "operator@example.test", platformRole: "PLATFORM_ADMIN", activeOrgId: "org", activeOrgRole: "ADMIN", membershipScope: null };

test("native identity requests, review and linking retain role, organization and state boundaries", async () => {
  const fixture: Fixture = { rows: { identityVerificationRequest: { fullName: "Applicant", requestedRole: "CARETAKER", status: "APPROVED" } }, calls: [] };
  const mod = await load("native-identity-actions", fixture);
  const define = mod.nativeIdentityActionDefinition;
  assert.equal(await define({ ...session, platformRole: "USER" }, "platform", "/platform/identity-verification", "identity.review", "request"), null);
  const scoped = { ...session, membershipScope: { scopeType: "UNIT", scopeId: "unit" } };
  assert.deepEqual(mod.nativeIdentityPageActions(scoped, "organization", "/dashboard/org/identity-verification"), []);
  const request = await define({ ...session, activeOrgRole: "OFFICE" }, "organization", "/dashboard/org/identity-verification", "identity.request") as NativeActionDefinition;
  assert.ok(nativeActionDefinitionSchema.safeParse(request).success);
  assert.deepEqual(request.groups[0].fields.find(field => field.name === "requestedRole")?.options?.map(option => option.value), ["TENANT", "LANDLORD"]);
  assert.equal(await define({ ...session, activeOrgRole: "OFFICE" }, "organization", "/dashboard/org/identity-verification", "identity.link", "request"), null);
  fixture.rows.identityVerificationRequest = { fullName: "Applicant", requestedRole: "TENANT", status: "PENDING" };
  const review = await define(session, "platform", "/platform/identity-verification", "identity.review", "request") as NativeActionDefinition;
  assert.ok(nativeActionDefinitionSchema.safeParse(review).success);
  const form = nativeActionFormData(review, { status: "APPROVED", reviewNotes: "Authenticated identity and recorded consent", identityConfirmed: "on" });
  assert.throws(() => nativeActionFormData(review, { requestId: "forged" }), /Unexpected form field/);
  await mod.executeNativeIdentityAction("platform", "identity.review", "request", form);
  assert.equal(fixture.calls[0].action, "reviewIdentityVerification");
  assert.equal(fixture.calls[0].values.requestId, "request");
  assert.equal(fixture.calls[0].values.identityConfirmed, "on");
  fixture.rows.identityVerificationRequest = { fullName: "Applicant", requestedRole: "TENANT", status: "USED" };
  assert.equal(await define(session, "platform", "/platform/identity-verification", "identity.review", "request"), null);
});

test("native agreement signing displays the exact body and sends its reviewed hash to the web transaction", async () => {
  const body = "Complete reviewed agreement. ".repeat(1000);
  const fixture: Fixture = { rows: {}, calls: [], access: { document: { orgId: "org", title: "Agreement", status: "ISSUED", contentHash: "reviewed-hash" }, data: { body, organizationSignature: { name: "Customer" } }, reminderCooldownActive: false } };
  const mod = await load("native-agreement-actions", fixture);
  const definition = await mod.nativeAgreementActionDefinition(session, "platform", "/platform/agreements", "agreement.sign", "agreement") as NativeActionDefinition;
  assert.ok(nativeActionDefinitionSchema.safeParse(definition).success);
  assert.equal(definition.groups[0].description, body);
  assert.equal(definition.groups[1].fields.find(field => field.name === "contentHash")?.defaultValue, "reviewed-hash");
  const form = nativeActionFormData(definition, { contentHash: "reviewed-hash", name: session.fullName, consent: "on" });
  await mod.executeNativeAgreementAction("platform", "agreement.sign", "agreement", form);
  assert.equal(fixture.calls[0].action, "changeAgreement");
  assert.equal(fixture.calls[0].subject, "agreement");
  assert.equal(fixture.calls[0].values.command, "platform-sign");
  assert.equal(fixture.calls[0].values.contentHash, "reviewed-hash");
  assert.equal(fixture.calls[0].values.consent, "on");
  assert.equal(await mod.nativeAgreementActionDefinition(session, "organization", "/dashboard/org/agreements", "agreement.sign", "agreement"), null);
  const longDraft = nativeActionRequestSchema.safeParse({ kind: "platform", path: "/platform/agreements", actionId: "agreement.edit", recordId: "agreement", values: { body: "x".repeat(60000) } });
  assert.ok(longDraft.success);
  assert.equal(nativeActionRequestSchema.safeParse({ ...longDraft.data, values: { body: "x".repeat(60001) } }).success, false);
});

test("native provider moderation and organization access use resolved targets and policy revisions", async () => {
  const fixture: Fixture = { rows: { providerReport: { id: "report", providerId: "provider", provider: { businessName: "Example Provider", status: "ACTIVE" } }, organization: { name: "Example", settings: { roleAccess: {} } } }, calls: [] };
  const mod = await load("native-operator-actions", fixture);
  const definition = await mod.nativeOperatorActionDefinition(session, "/platform/service-providers/reports", "provider.report-moderate", "report:report") as NativeActionDefinition;
  assert.ok(nativeActionDefinitionSchema.safeParse(definition).success);
  await mod.executeNativeOperatorAction("/platform/service-providers/reports", "provider.report-moderate", "report:report", nativeActionFormData(definition, { status: "SUSPENDED", reason: "Verified report and recorded moderation reason" }));
  assert.equal(fixture.calls[0].action, "moderateProvider");
  assert.equal(fixture.calls[0].values.providerId, "provider");
  assert.equal(fixture.calls[0].values.reportId, "report");
  assert.deepEqual(mod.nativeOperatorRecordActions("/platform/service-providers", "DELETED") as NativeActionLink[], []);
  assert.equal(await mod.nativeOperatorActionDefinition({ ...session, platformRole: "USER" }, "/platform/organizations", "organization.access.ADMIN", "org"), null);
  const access = await mod.nativeOperatorActionDefinition(session, "/platform/organizations", "organization.access.ADMIN", "org") as NativeActionDefinition;
  assert.ok(nativeActionDefinitionSchema.safeParse(access).success);
  assert.match(access.groups[0].fields.find(field => field.name === "revision")?.defaultValue ?? "", /^[a-f0-9]{64}$/);
  const form = nativeActionFormData(access, { role: "ADMIN", revision: access.groups[0].fields.find(field => field.name === "revision")!.defaultValue!, blockedViews: ["payments"], "permission:payments.verify": "deny", command: "save" });
  await mod.executeNativeOperatorAction("/platform/organizations", "organization.access.ADMIN", "org", form);
  assert.equal(fixture.calls[1].action, "saveOrganizationRoleAccess");
  assert.equal(fixture.calls[1].subject, "org");
  assert.equal(fixture.calls[1].values.revision, form.get("revision"));
});

test("native exported files preserve a bounded ZIP transport without accepting other file types", () => {
  assert.ok(nativeActionResultSchema.safeParse({ ok: true, message: "Export ready", file: { filename: "organization.zip", content: "UEsDBA==", mimeType: "application/zip" } }).success);
  assert.equal(nativeActionResultSchema.safeParse({ ok: true, message: "Export ready", file: { filename: "export.html", content: "UEsDBA==", mimeType: "text/html" } }).success, false);
});
