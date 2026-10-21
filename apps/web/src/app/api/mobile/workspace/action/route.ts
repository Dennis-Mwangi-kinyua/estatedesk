import { executeNativeResolutionAction } from "@/lib/mobile/native-resolution-actions";
import { nativeActionRequestSchema, nativeActionDefinitionSchema, nativeActionFormData } from "@estatedesk/contracts/mobile";
import { executeNativeOperatorAction } from "@/lib/mobile/native-operator-actions";
import { prisma } from "@/lib/prisma";
import { executeNativeAgreementAction } from "@/lib/mobile/native-agreement-actions";
import { executeNativeIdentityAction } from "@/lib/mobile/native-identity-actions";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";
import { readBoundedJson } from "@/lib/security/bounded-json";
import { mobileWorkspaceAllowed, mobileWorkspaceLinks } from "@/lib/mobile/workspace-menu";
import { nativeWorkspaceEntry } from "@/lib/mobile/native-workspace-policy";
import { executeNativePlatformAction, nativePlatformRedirectResult } from "@/lib/mobile/native-platform-actions";
import { safeServerActionError } from "@/lib/errors/server-error-log";
import { nativeActionDefinition } from "@/lib/mobile/native-actions";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { createPropertyAction } from "@/features/properties/actions/create-property-action";
import { publishNoticeAction } from "@/features/community/actions";
import { updateOnboardingRequestAction, deleteOnboardingRequestAction } from "@/app/(app)/platform/onboarding/actions";
import { markPlatformMessageReadAction, markPlatformMessageSpamAction, closePlatformMessageAction, reopenPlatformMessageAction, deletePlatformMessageAction } from "@/app/(app)/platform/messages/actions";
import { createTenantAction } from "@/features/tenants/actions/create-tenant-action";
import { sendPlatformMessageAction } from "@/app/(app)/dashboard/org/support/actions";
import { createPlatformUserAction } from "@/app/(app)/platform/users/actions";
import { createMarketerAction, updateMarketerAction } from "@/app/(app)/platform/marketing/actions";
import { toggleOrganizationFeatureFlagAction } from "@/app/(app)/platform/feature-flags/actions";
import { recordBackupCheckpointAction, markRestoreDrillAction } from "@/app/(app)/platform/backups/actions";
import { clearExpiredRateLimitBucketsAction, clearRateLimitScopeAction } from "@/app/(app)/platform/rate-limits/actions";
import { CREATE_ERROR_MESSAGES } from "@/app/(app)/platform/users/_lib/constants";
import { cookies } from "next/headers";
import { executeNativeInventoryAction } from "@/lib/mobile/native-inventory-actions";
import { executeNativeStaffAction } from "@/lib/mobile/native-staff-actions";
import { executeNativeTenantAction } from "@/lib/mobile/native-tenant-admin-actions";
import { executeNativeAccountingAction } from "@/lib/mobile/native-accounting-actions";
import { executeNativeBnbAction } from "@/lib/mobile/native-bnb-actions";
import { executeNativeVacancyInquiryAction } from "@/lib/mobile/native-vacancy-inquiry-actions";
import { getPlatformUnlockCookieName, getSessionCookieName, getSupportSessionCookieName } from "@/lib/auth/cookies";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const input = nativeActionRequestSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    if (input.kind === "landlord") return mobileJson({ error: "Landlord pages are read-only in this native workspace." }, 403);
    if (!mobileWorkspaceAllowed(session, input.kind) || !nativeWorkspaceEntry(mobileWorkspaceLinks(session, input.kind), input.path)) return mobileJson({ error: "This action is unavailable for your account." }, 403);
    const definition = await nativeActionDefinition(session, input.kind, input.path, input.actionId, input.recordId);
    if (definition && request.headers.get("x-estatedesk-signatures") !== "image-v1") {
      definition.groups = definition.groups.map(group => ({ ...group, fields: group.fields.filter(field => field.type !== "signature") }));
    }
    return definition ? mobileJson(nativeActionDefinitionSchema.parse(definition)) : mobileJson({ error: "This action is unavailable or the record has changed." }, 403);
  });
}

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (!request.headers.get("content-type")?.startsWith("application/json")) return mobileJson({ error: "JSON required." }, 400);
    const input = nativeActionRequestSchema.parse(await readBoundedJson(request, 640000));
    if (input.kind === "landlord") return mobileJson({ error: "Landlord pages are read-only in this native workspace." }, 403);
    if (!mobileWorkspaceAllowed(session, input.kind) || !nativeWorkspaceEntry(mobileWorkspaceLinks(session, input.kind), input.path)) return mobileJson({ error: "This action is unavailable for your account." }, 403);
    const definition = await nativeActionDefinition(session, input.kind, input.path, input.actionId, input.recordId);
    if (!definition) return mobileJson({ error: "This action is unavailable or the record has changed." }, 403);
    let form: FormData;
    try { form = nativeActionFormData(definition, input.values ?? {}); }
    catch (cause) { return mobileJson({ error: cause instanceof Error ? cause.message : "Check the form fields." }, 400); }
    try {
      if (input.actionId.startsWith("accounting.")) {
        const result = await executeNativeAccountingAction(input.kind, input.path, input.actionId, input.recordId, form);
        return result && "error" in result ? mobileJson({ error: result.error }, 400) : result ? mobileJson(result) : mobileJson({ error: "This action is unavailable." }, 403);
      }
      if (input.actionId.startsWith("bnb.")) {
        const result = await executeNativeBnbAction(session, input.path, input.actionId, input.recordId, form);
        return "error" in result ? mobileJson({ error: result.error }, 400) : mobileJson(result);
      }
      if (input.actionId === "vacancy-inquiry.status") {
        const result = await executeNativeVacancyInquiryAction(session, input.path, input.actionId, input.recordId, form);
        return "error" in result ? mobileJson({ error: result.error }, 400) : mobileJson(result);
      }
      if (input.actionId.startsWith("tenant.")) {
        const result = await executeNativeTenantAction(input.kind, input.path, input.actionId, input.recordId, form);
        return result && "error" in result ? mobileJson({ error: result.error }, 400) : result ? mobileJson(result) : mobileJson({ error: "This action is unavailable." }, 403);
      }
      if (input.actionId.startsWith("staff.")) {
        const result = await executeNativeStaffAction(input.kind, input.path, input.actionId, input.recordId, form);
        return result && "error" in result ? mobileJson({ error: result.error }, 400) : result ? mobileJson(result) : mobileJson({ error: "This action is unavailable." }, 403);
      }
      if (input.kind === "organization" && input.actionId.startsWith("resolution.")) return mobileJson(await executeNativeResolutionAction(session, input.path, input.actionId, input.recordId, form));
      if (input.kind === "organization" && (input.actionId === "unit.edit" || input.actionId.startsWith("inventory."))) {
        const result = await executeNativeInventoryAction(session, input.path, input.actionId, input.recordId, form);
        return result.error ? mobileJson({ error: result.error }, 400) : mobileJson({ ok: true, message: result.message ?? "Unit saved." });
      }
      if (input.kind === "platform" && (input.actionId.startsWith("provider.") || input.actionId.startsWith("attribution.") || input.actionId.startsWith("organization.access."))) return mobileJson(await executeNativeOperatorAction(input.path, input.actionId, input.recordId, form));
      if (input.actionId.startsWith("agreement.")) return mobileJson(await executeNativeAgreementAction(input.kind, input.actionId, input.recordId, form));
      if (input.actionId.startsWith("identity.")) {
        const result = await executeNativeIdentityAction(input.kind, input.actionId, input.recordId, form);
        return result.error ? mobileJson({ error: result.error }, 400) : mobileJson({ ok: true, message: result.message ?? "Identity verification updated." });
      }
      if (input.kind === "platform") { const additional = await executeNativePlatformAction(session, input.path, input.actionId, input.recordId, form); if (additional) return mobileJson(additional); }
      if (input.actionId === "tenant.create") {
        const result = await createTenantAction({ status: "idle" }, form);
        if (result.status !== "success") return mobileJson({ error: result.message ?? "Unable to create tenant." }, 400);
        return mobileJson({ ok: true, message: result.message ?? "Tenant created.", allocationDraft: result.allocationDraft,
          ...(result.credentials ? { credentials: { ...result.credentials, fullName: result.credentials.tenantName } } : {}),
        });
      }
      if (input.actionId === "user.create") return mobileJson({ ok: true, message: "Platform user created.", ...await createPlatformUserAction(form) });
      if (input.actionId === "support.send") {
        const result = await sendPlatformMessageAction({ ok: false }, form);
        return result.ok ? mobileJson({ ok: true, message: result.message ?? "Message sent." }) : mobileJson({ error: result.message }, 400);
      }
      if (input.actionId.startsWith("marketer.")) {
        form.set("marketerId", input.recordId ?? "");
        const result = await (input.actionId === "marketer.create" ? createMarketerAction : updateMarketerAction)({ ok: false, message: "" }, form);
        return result.ok ? mobileJson(result) : mobileJson({ error: result.message }, 400);
      }
      if (input.actionId === "feature.update") {
        form.set("orgId", input.recordId!); await toggleOrganizationFeatureFlagAction(form);
        return mobileJson({ ok: true, message: "Organization feature updated." });
      }
      if (input.actionId === "backup.checkpoint") await recordBackupCheckpointAction(form);
      if (input.actionId === "backup.drill") await markRestoreDrillAction(form);
      if (input.actionId === "rate.expired" || input.actionId === "rate.scope") {
        if (input.actionId === "rate.expired") await clearExpiredRateLimitBucketsAction(); else await clearRateLimitScopeAction(form);
        return mobileJson({ ok: true, message: `${definition.title} completed.` });
      }
      if (input.actionId === "property.create") {
        const result = await createPropertyAction(form);
        return mobileJson({ ok: true, message: "Property created successfully.", ...result });
      }
      if (input.actionId === "community.publish") {
        const result = await publishNoticeAction({}, form);
        return result.error ? mobileJson({ error: result.error }, 400) : mobileJson({ ok: true, message: result.message ?? "Notice published." });
      }
      if (input.actionId.startsWith("onboarding.")) {
        form.set("requestId", input.recordId!);
        if (input.actionId === "onboarding.update") await updateOnboardingRequestAction(form);
        else await deleteOnboardingRequestAction(form);
      } else {
        form.set("messageId", input.recordId!);
        const actions: Record<string, (form: FormData) => Promise<void>> = { "message.read": markPlatformMessageReadAction, "message.spam": markPlatformMessageSpamAction, "message.close": closePlatformMessageAction, "message.reopen": reopenPlatformMessageAction, "message.delete": deletePlatformMessageAction };
        await actions[input.actionId](form);
      }
      return mobileJson({ ok: true, message: `${definition.title} completed.` });
    } catch (cause) {
      if (!isRedirectError(cause)) return mobileJson({ error: safeServerActionError("nativeWorkspaceAction", cause, "Unable to complete this action. Check the current state before retrying.") }, 400);
      const url = new URL(getURLFromRedirectError(cause) ?? "/", "https://estatedesk.invalid");
      if (url.origin !== "https://estatedesk.invalid") throw cause;
      if (input.actionId.startsWith("accounting.account.") && url.pathname === "/dashboard/org/accounting/coa" && !url.searchParams.has("error")) {
        return mobileJson({ ok: true, message: input.actionId.endsWith("create") ? "Accounting account created." : "Accounting account updated." });
      }
      if (input.actionId === "accounting.journal.create" && url.pathname === "/dashboard/org/accounting/journals" && !url.searchParams.has("error")) {
        const draft = url.searchParams.get("message") === "Draft journal saved";
        return mobileJson({ ok: true, message: draft ? "Journal saved as a draft." : "Journal posted to the ledger." });
      }
      if (["support.enter", "support.extend", "support.leave"].includes(input.actionId) && (url.pathname === "/dashboard/org" || input.actionId === "support.leave" && url.pathname === "/platform/support-access") && !url.searchParams.has("error")) {
        const store = await cookies(); const sessionName = getSessionCookieName(); const supportName = getSupportSessionCookieName();
        const sessionValue = store.get(sessionName)?.value; const supportValue = store.get(supportName)?.value;
        if (!sessionValue) return mobileJson({ error: "The support session could not be updated." }, 403);
        return mobileJson({ ok: true, message: input.actionId === "support.leave" ? "Support access closed." : "Timed support access updated.", contextChanged: true, sessionCookie: `${sessionName}=${sessionValue}`, supportCookie: supportValue ? `${supportName}=${supportValue}` : null });
      }
      if (input.actionId === "vault.unlock" && url.pathname === "/platform/api-keys" && !url.searchParams.has("error")) {
        const store = await cookies(); const name = getPlatformUnlockCookieName(); const value = store.get(name)?.value;
        if (!value) return mobileJson({ error: "The vault could not be unlocked." }, 403);
        return mobileJson({ ok: true, message: "API key vault unlocked for this account.", vaultCookie: `${name}=${value}` });
      }
      if (input.kind === "platform" && input.actionId.startsWith("organization.access.") && input.recordId) {
        const organization = await prisma.organization.findFirst({ where: { id: input.recordId, deletedAt: null }, select: { slug: true } });
        if (organization && url.pathname === `/platform/organizations/${encodeURIComponent(organization.slug)}/access`) {
          if (url.searchParams.get("saved") === "1") return mobileJson({ ok: true, message: "Organization role access saved." });
          if (url.searchParams.has("error")) return mobileJson({ error: "Access rules changed or could not be saved. Reload the role settings before trying again." }, 400);
        }
      }
      const additional = input.kind === "platform" && nativePlatformRedirectResult(input.path, input.actionId, url);
      if (additional) return mobileJson(additional, "error" in additional ? 400 : 200);
      if (input.actionId === "user.create" && url.pathname === "/platform/users/new" && url.searchParams.has("createError")) return mobileJson({ error: CREATE_ERROR_MESSAGES[url.searchParams.get("createError") as keyof typeof CREATE_ERROR_MESSAGES] ?? "Check the account fields." }, 400);
      if (input.actionId.startsWith("backup.") && url.pathname === "/platform/backups") {
        if (url.searchParams.get("error") === "invalid-evidence") return mobileJson({ error: "Choose a valid status and enter an evidence note of 10–2,000 characters." }, 400);
        const expected = input.actionId === "backup.checkpoint" ? "checkpoint" : "restore-drill";
        if (url.searchParams.get("ok") === expected) return mobileJson({ ok: true, message: "Operational evidence recorded." });
      }
      if (input.actionId === "property.create" && url.pathname === "/dashboard/org/properties/new" && url.searchParams.has("error")) return mobileJson({ error: url.searchParams.get("error") }, 400);
      if (input.actionId === "property.create" && url.pathname === "/dashboard/org/properties" && url.searchParams.get("created") === "1") return mobileJson({ ok: true, message: "Property created successfully." });
      if (input.actionId === "inventory.unit.delete" && url.pathname === "/dashboard/org/units" && !url.searchParams.has("error")) return mobileJson({ ok: true, message: "Unit deleted." });
      if (input.actionId === "inventory.building.delete" && url.pathname === "/dashboard/org/buildings" && !url.searchParams.has("error")) return mobileJson({ ok: true, message: "Building deleted." });
      if (input.actionId === "inventory.unit.create" && /^\/dashboard\/org\/units\/[^/]+$/.test(url.pathname)) return mobileJson({ ok: true, message: "Unit created." });
      if (input.actionId === "inventory.unit.create" && url.pathname.endsWith("/units/new") && url.searchParams.has("error")) return mobileJson({ error: url.searchParams.get("error") ?? "Unable to create this unit." }, 400);
      throw cause;
    }
  });
}
