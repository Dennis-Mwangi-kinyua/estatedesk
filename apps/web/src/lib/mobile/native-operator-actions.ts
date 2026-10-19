import "server-only";
import { createHash } from "node:crypto";
import type { AppSession } from "@/lib/auth/session";
import type { NativeActionDefinition, NativeActionField, NativeActionLink, NativeActionResult } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { moderateProvider, dismissProviderReport } from "@/features/providers/actions";
import { updateLeadAttributionAction, updateOrganizationAttributionAction } from "@/app/(app)/platform/marketing/actions";
import { saveOrganizationRoleAccess } from "@/app/(app)/platform/organizations/[slug]/access/actions";
import { ORGANIZATION_ROLES, ORG_VIEW_LABELS, readOrgRolePolicies } from "@/lib/permissions/org-role-policy";
import { ORG_PERMISSIONS } from "@/lib/permissions/role-matrix";
import { ORG_PERMISSION_LABELS } from "@/lib/permissions/permission-labels";

const field = (name: string, label: string, extra: Partial<NativeActionField> = {}): NativeActionField => ({ name, label, type: "text", ...extra });
const option = (value: string) => ({ value, label: value.replaceAll("_", " ") });
export function nativeOperatorPageActions(path: string): NativeActionLink[] {
  return path === "/platform/marketing" ? [{ id: "attribution.lead", title: "Update lead attribution" }, { id: "attribution.organization", title: "Update organization attribution" }] : [];
}
export function nativeOperatorRecordActions(path: string, status?: string): NativeActionLink[] {
  if (["/platform/service-providers", "/platform/service-providers/reports"].includes(path)) return status === "REPORT_PENDING"
    ? [{ id: "provider.report-moderate", title: "Review provider and resolve report", destructive: true }, { id: "provider.dismiss", title: "Resolve report without account changes" }]
    : status === "DELETED" ? [] : [{ id: "provider.moderate", title: "Moderate provider account", destructive: true }];
  if (path === "/platform/organizations") return ORGANIZATION_ROLES.map(role => ({ id: `organization.access.${role}`, title: `Manage ${role.toLowerCase()} access` }));
  return [];
}

export async function nativeOperatorActionDefinition(session: AppSession, path: string, id: string, recordId?: string): Promise<NativeActionDefinition | null> {
  if (!["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole)) return null;
  if (["/platform/service-providers", "/platform/service-providers/reports"].includes(path) && id.startsWith("provider.") && recordId) {
    const report = recordId.startsWith("report:") ? await prisma.providerReport.findFirst({ where: { id: recordId.slice(7), resolvedAt: null }, select: { id: true, providerId: true, provider: { select: { businessName: true, status: true } } } }) : null;
    const provider = report?.provider ?? (!recordId.startsWith("report:") ? await prisma.serviceProvider.findUnique({ where: { id: recordId }, select: { businessName: true, status: true } }) : null);
    if (!provider || !nativeOperatorRecordActions(path, report ? "REPORT_PENDING" : provider.status).some(action => action.id === id)) return null;
    const dismiss = id === "provider.dismiss";
    if (!dismiss && provider.status === "DELETED") return null;
    return { id, title: dismiss ? "Resolve provider report" : "Moderate provider account", description: `${provider.businessName}. Removal deletes the public profile and portfolio and blocks provider access. Job, review and report records are retained.`, submitLabel: dismiss ? "Resolve report" : "Apply moderation", destructive: !dismiss, confirmation: dismiss ? "Resolve this report without changing the provider's account?" : "Apply this moderation decision to the provider account?", groups: [{ id: "moderation", title: "Review outcome", fields: [
      ...dismiss ? [] : [field("status", "Account decision", { type: "select", required: true, defaultValue: "FLAGGED", options: ["FLAGGED", "SUSPENDED", "ACTIVE", "DELETED"].map(option) })],
      field("reason", "Decision reason (at least 10 characters)", { type: "multiline", required: true, maxLength: 2000 }),
    ] }] };
  }
  if (path === "/platform/marketing" && ["attribution.lead", "attribution.organization"].includes(id) && !recordId) {
    const lead = id === "attribution.lead";
    const [marketers, records] = await Promise.all([
      prisma.platformMarketer.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
      lead ? prisma.onboardingRequest.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, companyName: true } }).then(rows => rows.map(row => ({ value: row.id, label: row.companyName })))
        : prisma.organization.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }).then(rows => rows.map(row => ({ value: row.id, label: row.name }))),
    ]);
    return { id, title: lead ? "Lead attribution" : "Organization attribution", description: "Choose the referral owner and commission decision. Saving replaces the selected record's current attribution.", submitLabel: "Save attribution", confirmation: "Save the referral attribution and commission details?", groups: [{ id: "attribution", title: "Attribution and commission", fields: [
      field(lead ? "requestId" : "orgId", lead ? "Onboarding lead" : "Organization", { type: "select", required: true, options: records }),
      field("marketerId", "Marketer", { type: "select", defaultValue: "none", options: [{ value: "none", label: "No marketer" }, ...marketers.map(row => ({ value: row.id, label: row.fullName }))] }),
      field("commissionRate", "Commission rate (%)", { type: "decimal" }),
      field("commissionStatus", "Commission status", { type: "select", required: true, defaultValue: "PENDING", options: ["PENDING", "APPROVED", "PAID", "CANCELLED"].map(option) }),
      field("commissionNotes", "Commission notes", { type: "multiline", maxLength: 2000 }),
    ] }] };
  }
  if (path === "/platform/organizations" && id.startsWith("organization.access.") && recordId) {
    const role = ORGANIZATION_ROLES.find(value => id === `organization.access.${value}`);
    if (!role) return null;
    const org = await prisma.organization.findFirst({ where: { id: recordId, deletedAt: null }, select: { name: true, settings: { select: { roleAccess: true } } } });
    if (!org) return null;
    const policy = readOrgRolePolicies(org.settings?.roleAccess)[role] ?? { permissions: {}, blockedViews: [] };
    return { id, title: `${role} access`, description: org.name, submitLabel: "Save role access", confirmation: `Apply these access rules to ${role.toLowerCase()} accounts in ${org.name}?`, groups: [{ id: "views", title: "Visible sections", fields: [
      field("role", "Role", { type: "hidden", defaultValue: role }),
      field("revision", "Policy revision", { type: "hidden", defaultValue: createHash("sha256").update(JSON.stringify(policy)).digest("hex") }),
      field("command", "Action", { type: "select", defaultValue: "save", options: [{ value: "save", label: "Save custom rules" }, { value: "reset", label: "Reset this role to defaults" }] }),
      field("blockedViews", "Block access to these sections", { type: "multiselect", defaultValue: JSON.stringify(policy.blockedViews), options: Object.entries(ORG_VIEW_LABELS).map(([value, label]) => ({ value, label })) }),
    ] }, { id: "permissions", title: "Permission overrides", description: "Set how this role can manage workspace records and operations.", fields: ORG_PERMISSIONS.map(permission => field(`permission:${permission}`, ORG_PERMISSION_LABELS[permission], { type: "select", defaultValue: policy.permissions[permission] ?? "default", options: [{ value: "default", label: "Role default" }, { value: "allow", label: "Allow" }, { value: "deny", label: "Deny" }] })) }] };
  }
  return null;
}

export async function executeNativeOperatorAction(path: string, id: string, recordId: string | undefined, form: FormData): Promise<NativeActionResult> {
  if (["/platform/service-providers", "/platform/service-providers/reports"].includes(path) && recordId && id.startsWith("provider.")) {
    if (recordId.startsWith("report:")) {
      const report = await prisma.providerReport.findFirst({ where: { id: recordId.slice(7), resolvedAt: null }, select: { id: true, providerId: true } });
      if (!report) throw new Error("This report has already been reviewed.");
      form.set("reportId", report.id); form.set("providerId", report.providerId);
    } else form.set("providerId", recordId);
    const result = await (id === "provider.dismiss" ? dismissProviderReport : moderateProvider)({}, form);
    if (result.error) throw new Error(result.error);
    return { ok: true, message: result.message ?? "Provider moderation saved." };
  }
  if (path === "/platform/marketing" && ["attribution.lead", "attribution.organization"].includes(id)) {
    const result = await (id === "attribution.lead" ? updateLeadAttributionAction : updateOrganizationAttributionAction)({ ok: false, message: "" }, form);
    if (!result.ok) throw new Error(result.message);
    return { ok: true, message: result.message };
  }
  if (path === "/platform/organizations" && id.startsWith("organization.access.") && recordId) {
    const role = ORGANIZATION_ROLES.find(value => id === `organization.access.${value}`);
    if (!role) throw new Error("Invalid organization role.");
    form.set("role", role);
    await saveOrganizationRoleAccess(recordId, form);
    return { ok: true, message: "Organization role access saved." };
  }
  throw new Error("This operator action is unavailable.");
}
