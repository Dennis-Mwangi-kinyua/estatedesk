import "server-only";
import { GET as downloadApprovedExport } from "@/app/api/data-exports/[requestId]/download/route";
import { GET as downloadOrganizationExport } from "@/app/api/platform/data-exports/[slug]/download/route";
import { randomUUID } from "node:crypto";
import type { AppSession } from "@/lib/auth/session";
import type { NativeActionDefinition, NativeActionField, NativeActionLink, NativeActionResult } from "@estatedesk/contracts/mobile";
import { BillingPlan, ExpenditureCategory, SubscriptionStatus, PlatformPermissionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { getPlatformControl } from "@/lib/platform/control";
import { PLATFORM_FEATURE_FLAG_KEYS } from "@/app/(app)/platform/_lib/nav";
import * as controls from "@/app/(app)/platform/control/actions";
import * as jobs from "@/app/(app)/platform/jobs/actions";
import { createPlatformExpenditureAction } from "@/app/(app)/platform/expenditures/actions";
import { approveDataExportRequestAction, rejectDataExportRequestAction } from "@/app/(app)/platform/data-management/actions";
import { applyUpgradeRequestAction, rejectUpgradeRequestAction } from "@/app/(app)/platform/billing/actions";
import { organizationBillingAction } from "@/app/(app)/platform/organizations/[slug]/billing-actions";
import { createOrganizationAction } from "@/app/(app)/platform/organizations/new/actions";
import { archiveOrganizationAction, permanentlyDeleteOrganizationAction } from "@/app/(app)/platform/organizations/[slug]/actions";
import { resetRateLimitBucketAction } from "@/app/(app)/platform/rate-limits/actions";
import { SUBSCRIPTION_INVOICE_ENTITY } from "@/lib/billing/invoice-ledger";
import { accountLoginUrl } from "@/lib/notifications/account-login-url";
import { isPlatformApiKeysUnlocked, unlockPlatformApiKeysPageAction, createVacantHousesApiKeyAction, togglePlatformApiKeyStatusAction, deletePlatformApiKeyAction } from "@/app/(app)/platform/api-keys/actions";
import { createPlatformAdmin, deletePlatformAdmin } from "@/app/(app)/platform/admins/_lib/actions";
import { enterOrgSupportAccessAction, leaveOrgSupportAccessAction, extendOrgSupportAccessAction } from "@/app/(app)/platform/support-access/actions";
import { getActiveSupportSession } from "@/lib/platform/support-session";

const field = (name: string, label: string, extra: Partial<NativeActionField> = {}): NativeActionField => ({ name, label, type: "text", ...extra });
const choices = (values: readonly string[]) => values.map(value => ({ value, label: value.replaceAll("_", " ") }));
const select = (name: string, label: string, values: readonly string[], defaultValue?: string) => field(name, label, { type: "select", options: choices(values), required: true, defaultValue });
const phrase = (value: string) => field("confirmation", `Type ${value} to confirm`, { required: true });
type Spec = { id: string; path: string; title: string; record?: boolean; destructive?: boolean; fields?: NativeActionField[]; run?: (form: FormData) => Promise<unknown>; redirect?: string; successKey?: string };
const control = (id: string, title: string, fields: NativeActionField[], run: Spec["run"], successKey: string, destructive = true): Spec => ({ id: `control.${id}`, path: "/platform/control", title, fields, run, redirect: "/platform/control", successKey, destructive });
const specs: Spec[] = [
  { id: "admin.create", path: "/platform/admins", title: "New platform admin", run: createPlatformAdmin },
  { id: "admin.delete", path: "/platform/admins", title: "Delete platform admin", destructive: true, record: true, run: deletePlatformAdmin },
  { id: "support.enter", path: "/platform/support-access", title: "Start timed support access", record: true, run: enterOrgSupportAccessAction },
  { id: "support.leave", path: "/platform/support-access", title: "Leave support access", run: leaveOrgSupportAccessAction },
  { id: "support.extend", path: "/platform/support-access", title: "Extend support access", run: () => extendOrgSupportAccessAction() },
  { id: "vault.unlock", path: "/platform/api-keys", title: "Unlock API key vault", run: unlockPlatformApiKeysPageAction, redirect: "/platform/api-keys" },
  { id: "vault.create", path: "/platform/api-keys", title: "Create API key" },
  { id: "vault.toggle", path: "/platform/api-keys", title: "Change key status", record: true, run: togglePlatformApiKeyStatusAction },
  { id: "vault.delete", path: "/platform/api-keys", title: "Delete API key", record: true, destructive: true, run: deletePlatformApiKeyAction },
  { id: "organization.create", path: "/platform/organizations", title: "New organization" },
  { id: "organization.archive", path: "/platform/organizations", title: "Archive organization", record: true, destructive: true, run: archiveOrganizationAction, redirect: "/platform/organizations", successKey: "archived" },
  { id: "organization.delete", path: "/platform/organizations", title: "Permanently delete organization", record: true, destructive: true, run: permanentlyDeleteOrganizationAction, redirect: "/platform/organizations", successKey: "deleted" },
  { id: "expenditure.create", path: "/platform/expenditures", title: "Record expenditure", run: createPlatformExpenditureAction },
  { id: "export.organization", path: "/platform/data-management", title: "Download organization CSV archive" },
  { id: "export.download", path: "/platform/data-management", title: "Download approved CSV archive", record: true },
  { id: "export.approve", path: "/platform/data-management", title: "Approve export request", record: true, run: approveDataExportRequestAction },
  { id: "export.reject", path: "/platform/data-management", title: "Reject export request", record: true, run: rejectDataExportRequestAction },
  { id: "billing.invoice", path: "/platform/billing", title: "Generate subscription invoice", record: true },
  { id: "billing.payment", path: "/platform/billing", title: "Record subscription payment", record: true },
  { id: "billing.renew", path: "/platform/billing", title: "Renew subscription", record: true },
  { id: "billing.cancel", path: "/platform/billing", title: "Cancel subscription", record: true, destructive: true },
  { id: "billing.upgrade", path: "/platform/billing", title: "Apply upgrade request", record: true, run: applyUpgradeRequestAction, redirect: "/platform/billing", successKey: "upgrade-applied" },
  { id: "billing.reject-upgrade", path: "/platform/billing", title: "Reject upgrade request", record: true, run: rejectUpgradeRequestAction, redirect: "/platform/billing", successKey: "upgrade-rejected" },
  { id: "job.retry", path: "/platform/jobs", title: "Retry failed notification", run: jobs.retryFailedNotificationAction, redirect: "/platform/jobs" },
  { id: "job.retry-all", path: "/platform/jobs", title: "Retry all failed notifications", run: jobs.retryAllFailedNotificationsAction, redirect: "/platform/jobs" },
  { id: "job.notifications", path: "/platform/jobs", title: "Run notification job", run: jobs.runNotificationsJobAction, redirect: "/platform/jobs" },
  { id: "job.retention", path: "/platform/jobs", title: "Run retention job", destructive: true, run: jobs.runRetentionJobAction, redirect: "/platform/jobs" },
  { id: "job.kra-retry", path: "/platform/jobs", title: "Queue KRA retry", run: jobs.queueKraRetryAction, redirect: "/platform/jobs" },
  { id: "notification.retry", path: "/platform/jobs/notifications", title: "Retry failed delivery", record: true, run: jobs.retryFailedNotificationAction, redirect: "/platform/jobs" },
  { id: "rate.reset", path: "/platform/rate-limits", title: "Reset rate-limit bucket", record: true, run: resetRateLimitBucketAction },
  control("switches", "Service controls", [], controls.updateKillSwitchesAction, "kill-switches"),
  control("feature", "Global feature override", [select("featureKey", "Feature", PLATFORM_FEATURE_FLAG_KEYS), select("mode", "Override", ["inherit", "on", "off"], "inherit")], controls.updateGlobalFeatureKillAction, "global-feature"),
  control("org-status", "Force organization status", [select("status", "Status", ["ACTIVE", "SUSPENDED", "DISABLED"])], controls.forceOrgStatusAction, "org-status"),
  control("all-features", "Set feature for all organizations", [select("featureKey", "Feature", PLATFORM_FEATURE_FLAG_KEYS), field("enabled", "Enabled", { type: "checkbox" }), phrase("FORCE-ALL-ORGS")], controls.forceAllOrgsFeatureAction, "force-all-features"),
  control("subscription", "Override subscription", [select("plan", "Plan", Object.values(BillingPlan)), select("status", "Status", Object.values(SubscriptionStatus))], controls.overrideSubscriptionAction, "subscription"),
  control("user-status", "Force account status", [field("identifier", "Username, email or account ID", { required: true }), select("status", "Status", ["ACTIVE", "SUSPENDED", "DISABLED"]), field("reason", "Reason", { type: "multiline" })], controls.forceUserStatusDraftAction, "user-status"),
  control("password", "Require password change", [field("identifier", "Username, email or account ID", { required: true })], controls.forcePasswordChangeAction, "force-password"),
  control("sessions", "Revoke other users’ sessions", [phrase("REVOKE-ALL-SESSIONS")], controls.revokeAllSessionsAction, "sessions"),
  control("api-keys", "Revoke all API keys", [phrase("REVOKE-ALL-API-KEYS")], controls.revokeAllApiKeysAction, "api-keys"),
  control("rate-limits", "Clear all rate limits", [phrase("CLEAR-RATE-LIMITS")], controls.clearAllRateLimitsAction, "rate-limits"),
  control("purge", "Purge failed notifications", [phrase("PURGE-FAILED-NOTIFICATIONS")], controls.purgeFailedNotificationsAction, "purge-notifications"),
  control("crons", "Run all scheduled jobs", [phrase("RUN-ALL-CRONS")], controls.runAllCronJobsAction, "crons"),
  control("soft-delete", "Soft-delete organization", [phrase("the selected organization’s slug")], controls.softDeleteOrgAction, "soft-delete"),
  control("restore", "Restore organization", [], controls.restoreOrgAction, "restore-org"),
];
function specFor(path: string, id: string) {
  return specs.find(spec => spec.id === id && (spec.path === path || path === "/platform/subscriptions" && spec.path === "/platform/billing"));
}
export function nativePlatformPageActions(path: string): NativeActionLink[] {
  return specs.filter(spec => spec.path === path && !spec.record).map(({ id, title, destructive }) => ({ id, title, destructive }));
}
export function nativePlatformRecordActions(path: string, status?: string): NativeActionLink[] {
  return specs.filter(spec => specFor(path, spec.id) && spec.record && (spec.id !== "notification.retry" || status === "FAILED") && (!spec.id.startsWith("export.") || status === (spec.id === "export.download" ? "APPROVED" : "PENDING"))).map(({ id, title, destructive }) => ({ id, title, destructive }));
}
async function organizations(includeDeleted = false) {
  const rows = await prisma.organization.findMany({ where: includeDeleted ? {} : { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } });
  return rows.map(row => ({ value: row.id, label: `${row.name} · ${row.slug}` }));
}
type ActionRecord = { id?: string; name?: string; slug?: string; orgId?: string; reviewerNotes?: string | null; key?: string };
async function recordFor(spec: Spec, recordId: string | undefined): Promise<ActionRecord | null> {
  if (!spec.record) return {};
  if (!recordId) return null;
  if (spec.id.startsWith("organization.")) return prisma.organization.findFirst({ where: { id: recordId, deletedAt: null }, select: { id: true, name: true, slug: true } });
  if (spec.id.startsWith("export.")) return prisma.dataExportRequest.findUnique({ where: { id: recordId }, select: { id: true, reviewerNotes: true } });
  if (spec.id.startsWith("billing.")) return prisma.subscription.findUnique({ where: { id: recordId }, select: { id: true, orgId: true, status: true, org: { select: { name: true } } } });
  if (spec.id === "notification.retry") return prisma.notification.findFirst({ where: { id: recordId, status: "FAILED" }, select: { id: true } });
  if (spec.id === "rate.reset") return prisma.rateLimitBucket.findUnique({ where: { key: recordId }, select: { key: true } });
  if (spec.id.startsWith("vault.")) return prisma.apiKey.findUnique({ where: { id: recordId }, select: { id: true, name: true } });
  if (spec.id.startsWith("support.")) return prisma.organization.findFirst({ where: { id: recordId, deletedAt: null, status: "ACTIVE" }, select: { id: true, name: true } });
  if (spec.id === "admin.delete") {
    const user = await prisma.user.findFirst({ where: { id: recordId, deletedAt: null, platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] } }, select: { id: true, fullName: true, isRootSuperAdmin: true } });
    return user && !user.isRootSuperAdmin ? { id: user.id, name: user.fullName } : null;
  }
  return null;
}

export async function nativePlatformActionDefinition(session: AppSession, path: string, id: string, recordId?: string): Promise<NativeActionDefinition | null> {
  const spec = specFor(path, id);
  if (!spec || path === "/platform/control" && session.platformRole !== "SUPER_ADMIN") return null;
  const record = await recordFor(spec, recordId);
  if (!record) return null;
  if (id.startsWith("vault.") && id !== "vault.unlock" && !await isPlatformApiKeysUnlocked(session.userId)) return null;
  if (id === "support.extend" && !await getActiveSupportSession(session.userId)) return null;
  let fields = spec.fields ?? [];
  if (id === "support.enter") fields = [field("reason", "Support reason (at least 8 characters)", { type: "multiline", required: true }), select("hours", "Duration in hours", ["1", "2", "3", "4", "5", "6", "7", "8"], "2")];
  if (id === "admin.create") fields = [field("fullName", "Full name", { required: true }), field("username", "Username", { required: true, maxLength: 30 }), field("email", "Email", { type: "email", required: true }), field("phone", "Phone", { type: "phone" }), field("password", "Password", { type: "password", required: true }), field("confirmPassword", "Confirm password", { type: "password", required: true }), select("platformRole", "Platform role", session.platformRole === "SUPER_ADMIN" ? ["PLATFORM_ADMIN", "SUPER_ADMIN"] : ["PLATFORM_ADMIN"], "PLATFORM_ADMIN"), select("status", "Status", ["ACTIVE", "SUSPENDED", "DISABLED"], "ACTIVE"), field("canCreatePlatformAdmins", "Can create platform admins", { type: "checkbox" }), ...session.platformRole === "SUPER_ADMIN" ? [field("isRootSuperAdmin", "Root super admin", { type: "checkbox", when: { field: "platformRole", equals: "SUPER_ADMIN" } })] : [], field("permissions", "Explicit platform permissions", { type: "multiselect", defaultValue: "[]", options: choices(Object.values(PlatformPermissionType)) })];
  if (id === "vault.unlock") fields = [field("password", "Platform API management password", { type: "password", required: true })];
  if (id === "vault.create") fields = [field("orgId", "Organization", { type: "select", required: true, options: await organizations() }), field("name", "Key name", { required: true }), field("expiresAt", "Expiry date (optional)", { type: "date" })];
  if (id === "vault.toggle") fields = [select("nextActive", "Key status", ["true", "false"])];
  if (id === "organization.create") return { id, title: spec.title, description: "Create an organization, its owner account and initial subscription using the website's onboarding action.", submitLabel: "Create organization", confirmation: "Create this organization, owner account and subscription?", groups: [
    { id: "organization", title: "Organization", fields: [field("organizationName", "Organization name", { required: true }), field("organizationSlug", "Workspace address / slug"), field("organizationEmail", "Organization email", { type: "email" }), field("organizationPhone", "Organization phone (international format)", { type: "phone" }), field("organizationAddress", "Address", { type: "multiline" }), field("accountType", "Account type", { type: "select", defaultValue: "PROPERTY_MANAGER", options: choices(["PROPERTY_MANAGER", "LANDLORD"]) })] },
    { id: "configuration", title: "Configuration & billing", fields: [field("currencyCode", "Currency", { type: "select", required: true, defaultValue: "KES", options: SUPPORTED_CURRENCIES.map(item => ({ value: item.code, label: `${item.code} · ${item.name}` })) }), field("timezone", "Timezone", { required: true, defaultValue: "Africa/Nairobi" }), field("dataRetentionDays", "Data retention days", { type: "integer", required: true, defaultValue: "2555" }), select("plan", "Initial plan", Object.values(BillingPlan), "FREE"), field("onboardingRequestId", "Qualified onboarding request", { type: "select", options: [{ value: "", label: "No linked onboarding request" }, ...await prisma.onboardingRequest.findMany({ where: { status: "QUALIFIED" }, select: { id: true, companyName: true } }).then(rows => rows.map(row => ({ value: row.id, label: row.companyName })))] })] },
    { id: "owner", title: "Owner account", fields: [field("adminFullName", "Owner full name", { required: true }), field("adminUsername", "Owner username", { required: true, maxLength: 30 }), field("adminEmail", "Owner login email", { type: "email", required: true }), field("adminPhone", "Owner phone (international format)", { type: "phone" }), field("adminPassword", "Temporary password", { type: "password", required: true }), field("adminPasswordConfirm", "Confirm temporary password", { type: "password", required: true })] },
  ] };
  if (id === "expenditure.create") fields = [field("description", "Description", { required: true }), field("amount", "Amount", { type: "decimal", required: true }), field("currencyCode", "Currency", { type: "select", required: true, defaultValue: "KES", options: SUPPORTED_CURRENCIES.map(item => ({ value: item.code, label: item.code })) }), select("category", "Category", Object.values(ExpenditureCategory), "OTHER"), field("incurredAt", "Incurred date", { type: "date", required: true }), field("paid", "Already paid", { type: "checkbox" }), field("payee", "Payee"), field("reference", "Reference"), field("paymentMethod", "Payment method"), field("notes", "Notes", { type: "multiline" })];
  if (id.startsWith("organization.") && record.slug) fields = [field(id.endsWith("archive") ? "archiveConfirmation" : "confirmation", `Type ${record.slug} to confirm`, { required: true })];
  if (id === "export.organization") fields = [field("orgId", "Organization", { type: "select", required: true, options: await organizations(true) })];
  if (["export.approve", "export.reject"].includes(id)) fields = [field("reviewerNotes", "Reviewer notes", { type: "multiline", defaultValue: record.reviewerNotes ?? "" })];
  if (id.startsWith("billing.")) {
    if (id === "billing.invoice") fields = [field("sendEmail", "Also send invoice by email", { type: "checkbox" })];
    if (id === "billing.payment" && record.orgId) {
      const invoices = await prisma.documentRecord.findMany({ where: { orgId: record.orgId, entityType: SUBSCRIPTION_INVOICE_ENTITY }, orderBy: { createdAt: "desc" }, select: { id: true, serialNumber: true, title: true } });
      fields = [field("invoiceId", "Invoice", { type: "select", required: true, options: invoices.map(row => ({ value: row.id, label: `${row.serialNumber} · ${row.title}` })) }), field("paymentReference", "Payment reference", { required: true, maxLength: 120 }), field("amount", "Received amount", { type: "decimal", required: true }), field("paidAt", "Payment date", { type: "date", required: true }), field("paymentId", "Payment identifier", { type: "hidden", defaultValue: randomUUID(), required: true }), field("confirmed", "I confirm this payment was received", { type: "checkbox", required: true })];
    }
    if (["billing.renew", "billing.cancel"].includes(id)) fields = [field("confirmed", id === "billing.cancel" ? "I confirm subscription cancellation" : "I confirm payment before renewal", { type: "checkbox", required: true })];
    if (id === "billing.upgrade" || id === "billing.reject-upgrade") fields = [...id === "billing.upgrade" ? [field("paymentReference", "Payment reference")] : [], field("notes", "Resolution notes", { type: "multiline" })];
  }
  if (id === "job.retry") fields = [field("notificationId", "Failed notification", { type: "select", required: true, options: await prisma.notification.findMany({ where: { status: "FAILED" }, orderBy: { createdAt: "desc" }, select: { id: true, title: true } }).then(rows => rows.map(row => ({ value: row.id, label: row.title }))) })];
  if (id === "job.kra-retry") fields = [field("attemptId", "Retryable submission", { type: "select", required: true, options: await prisma.kraSubmissionAttempt.findMany({ where: { outcome: "RETRYABLE" }, select: { id: true, rentalReturn: { select: { filingKey: true } } } }).then(rows => rows.map(row => ({ value: row.id, label: row.rentalReturn.filingKey }))) })];
  if (id === "control.switches") {
    const current = await getPlatformControl();
    const switches = ["maintenanceMode", "incidentMode", "publicSignupDisabled", "publicApiDisabled", "webhooksDisabled", "cronDisabled", "tenantPortalsDisabled", "orgDashboardsDisabled"] as const;
    fields = [...switches.map(name => field(name, name.replace(/[A-Z]/g, match => ` ${match.toLowerCase()}`), { type: "checkbox", defaultValue: current[name] ? "on" : "" })), ...["maintenanceMessage", "incidentMessage", "notes"].map(name => field(name, name.replace(/[A-Z]/g, match => ` ${match.toLowerCase()}`), { type: "multiline", defaultValue: String(current[name as "notes"] ?? "") }))];
  }
  if (["control.org-status", "control.subscription", "control.soft-delete", "control.restore"].includes(id)) fields = [field("orgId", "Organization", { type: "select", required: true, options: await organizations(id === "control.restore") }), ...fields];

  return { id, title: spec.title, description: "This native form uses the same server action, authorization, audit and validation as the website.", submitLabel: spec.title, destructive: spec.destructive, confirmation: `${spec.title}? Review the values and confirmation fields before continuing.`, groups: fields.length ? [{ id: "details", title: spec.title, fields }] : [] };
}

/** Only named specs can execute; never accept an import path or function name from the client. */
export async function executeNativePlatformAction(session: AppSession, path: string, id: string, recordId: string | undefined, form: FormData): Promise<NativeActionResult | null> {
  const spec = specFor(path, id);
  if (!spec || path === "/platform/control" && session.platformRole !== "SUPER_ADMIN") return null;
  const record = await recordFor(spec, recordId);
  if (!record) throw new Error("The record is no longer available.");
  if (id.startsWith("vault.") && id !== "vault.unlock" && !await isPlatformApiKeysUnlocked(session.userId)) throw new Error("API key management is locked.");
  if (id === "admin.delete") form.set("userId", recordId!);
  if (id === "support.enter") form.set("orgId", recordId!);
  if (id === "support.leave") form.set("returnTo", "/platform/support-access");
  if (id === "vault.create") {
    const result = await createVacantHousesApiKeyAction({ success: false }, form);
    if (!result.success) throw new Error(result.error ?? "Unable to create API key.");
    return { ok: true, message: "API key created. Save it now; it is shown only once.", plainKey: result.plainKey };
  }
  if (id === "vault.toggle" || id === "vault.delete") form.set("apiKeyId", recordId!);
  if (id === "organization.create") {
    const result = await createOrganizationAction({ success: false }, form);
    if (!result.success) throw new Error([result.error, ...Object.values(result.fieldErrors ?? {}).flat()].filter(Boolean).join("\n") || "Check the organization fields.");
    const account = result.createdAccount;
    return { ok: true, message: `Organization created.${account?.verificationSent ? " Verification email sent." : ""}`, ...(account ? { credentials: { fullName: account.fullName, username: account.username, password: String(form.get("adminPassword")), email: account.email, phone: account.phone, loginUrl: accountLoginUrl() } } : {}) };
  }
  if (id.startsWith("organization.") && record.slug) { form.set("orgId", record.id!); form.set("expectedSlug", record.slug); }
  if (id === "export.download" || id === "export.organization") {
    const request = new Request("https://estatedesk.invalid");
    let response: Response;
    if (id === "export.download") response = await downloadApprovedExport(request, { params: Promise.resolve({ requestId: recordId! }) });
    else {
      const org = await prisma.organization.findUnique({ where: { id: String(form.get("orgId")) }, select: { slug: true } });
      if (!org) throw new Error("Organization not found.");
      response = await downloadOrganizationExport(request, { params: Promise.resolve({ slug: org.slug }) });
    }
    if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(error?.error ?? "Unable to prepare this data export."); }
    const content = Buffer.from(await response.arrayBuffer()).toString("base64");
    if (content.length > 36_000_000) throw new Error("This export exceeds the app's file limit. Use a smaller export.");
    const filename = response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "organization-export.zip";
    return { ok: true, message: "Organization CSV archive ready to save or share.", file: { filename, content, mimeType: "application/zip" } };
  }
  if (id.startsWith("export.")) form.set("requestId", recordId!);
  if (id === "notification.retry") { form.set("notificationId", recordId!); form.set("returnTo", "/platform/jobs"); }
  if (id === "rate.reset") form.set("key", recordId!);
  if (id.startsWith("billing.") && record.orgId) {
    form.set("orgId", record.orgId);
    if (["billing.invoice", "billing.payment", "billing.renew", "billing.cancel"].includes(id)) {
      form.set("operation", id.slice("billing.".length));
      const result = await organizationBillingAction({}, form);
      if (!result.success) throw new Error(result.error ?? "Unable to complete billing action.");
      return { ok: true, message: [result.success, result.error].filter(Boolean).join("\n"), ...(result.invoice ? { document: result.invoice } : {}) };
    }
  }
  if (id.startsWith("job.")) form.set("returnTo", "/platform/jobs");
  if (id === "control.soft-delete") { const organization = await prisma.organization.findUniqueOrThrow({ where: { id: String(form.get("orgId")) }, select: { slug: true } }); form.set("slug", organization.slug); }
  const result = await spec.run!(form);
  if (id === "control.user-status" && result && typeof result === "object" && "draft" in result) return { ok: true, message: "Account status updated.", allocationDraft: result.draft as NonNullable<NativeActionResult["allocationDraft"]> };
  return { ok: true, message: `${spec.title} completed.` };
}

export function nativePlatformRedirectResult(path: string, id: string, url: URL) {
  const spec = specFor(path, id);
  if (!spec?.redirect) return null;
  if (url.pathname !== spec.redirect) {
    if (id.startsWith("organization.") && url.pathname.startsWith("/platform/organizations/") && (url.searchParams.has("archiveError") || url.searchParams.has("deleteError"))) return { error: url.searchParams.get("archiveError") ?? url.searchParams.get("deleteError") ?? "Check the confirmation." };
    return null;
  }
  if (url.searchParams.has("error") || url.searchParams.get("messageType") === "error") return { error: url.searchParams.get("message") ?? `Unable to complete the action (${url.searchParams.get("error")}). Check the values and confirmation.` };
  if (id.startsWith("job.") && url.searchParams.has("message")) return { ok: true, message: url.searchParams.get("message")! };
  const key = id.startsWith("organization.") ? spec.successKey! : "ok";
  const expected = id.startsWith("organization.") ? null : spec.successKey;
  if (url.searchParams.has(key) && (expected === null || url.searchParams.get(key) === expected)) return { ok: true, message: `${spec.title} completed.` };
  return null;
}
