import "server-only";
import type { AppSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ORG_PERMISSIONS, canReceiveOrgMandates, memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import { ORG_PERMISSION_LABELS } from "@/lib/permissions/permission-labels";
import { updateStaffMandates } from "@/features/staff/actions/update-staff-mandates";
import { createMembership } from "@/features/staff/actions/create-membership";
import { updateMembership } from "@/features/staff/actions/update-membership";
import { deactivateMembershipAction } from "@/features/staff/actions/deactivate-membership";
import { STAFF_ROLES } from "@/features/staff/constants/role-meta";
import type { NativeActionDefinition, NativeActionLink } from "@estatedesk/contracts/mobile";

const field = (name: string, label: string, defaultValue = "", extra: Partial<import("@estatedesk/contracts/mobile").NativeActionField> = {}) => ({ name, label, type: "text" as const, defaultValue, ...extra });
const canManageStaff = (session: AppSession) => !!session.activeOrgId && memberHasOrgPermission(session, "org.users.manage");

export function nativeStaffPageActions(session: AppSession, kind: "organization" | "platform" | "landlord", path: string): NativeActionLink[] {
  return kind === "organization" && path === "/dashboard/org/staff" && canManageStaff(session)
    ? [{ id: "staff.create", title: "Add staff member" }]
    : [];
}

const permissionOptions = ORG_PERMISSIONS
  .filter(permission => permission !== "caretaker.fieldwork")
  .map(value => ({ value, label: ORG_PERMISSION_LABELS[value] }));

export async function nativeStaffActionDefinition(session: AppSession, kind: "organization" | "platform", path: string, actionId: string, recordId?: string): Promise<NativeActionDefinition | null> {
  if (kind !== "organization" || !session.activeOrgId) return null;

  if (path === "/dashboard/org/staff" && actionId === "staff.create" && canManageStaff(session)) {
    const [properties, buildings] = await Promise.all([
      prisma.property.findMany({ where: { orgId: session.activeOrgId, deletedAt: null, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.building.findMany({ where: { deletedAt: null, isActive: true, property: { orgId: session.activeOrgId, deletedAt: null, isActive: true } }, orderBy: [{ property: { name: "asc" } }, { name: "asc" }], select: { id: true, name: true, property: { select: { name: true } } } }),
    ]);
    const roles = session.activeOrgRole === "ADMIN" ? STAFF_ROLES : STAFF_ROLES.filter(role => role !== "ADMIN");
    const targets = [
      ...properties.map(row => ({ value: `PROPERTY:${row.id}`, label: `Property · ${row.name}` })),
      ...buildings.map(row => ({ value: `BUILDING:${row.id}`, label: `Building · ${row.name} · ${row.property.name}` })),
    ];
    return { id: actionId, title: "Add staff member", description: "Create a staff login, organization membership, staff profile and optional caretaker assignment using the website onboarding rules.", submitLabel: "Create staff account", confirmation: "Create this staff account? The temporary password will be shown once so you can share it securely with the staff member.", groups: [
      { id: "role", title: "Role", fields: [field("role", "Organization role", "MANAGER", { type: "select", required: true, options: roles.map(role => ({ value: role, label: role.replaceAll("_", " ") })) })] },
      { id: "profile", title: "Staff details", fields: [field("fullName", "Full name", "", { required: true, maxLength: 120 }), field("username", "Username", "", { required: true, maxLength: 30 }), field("email", "Email", "", { type: "email", required: true, maxLength: 180 }), field("phone", "Phone", "", { type: "phone", required: true, maxLength: 40 }), field("jobTitle", "Job title", "", { required: true, maxLength: 120 }), field("educationLevel", "Education level", "", { required: true, maxLength: 80 }), field("nationalId", "National ID / employee ID", "", { required: true, maxLength: 80 }), field("emergencyContact", "Emergency contact", "", { required: true, maxLength: 160 }), field("staffProfileNotes", "Staff profile notes", "", { type: "multiline", required: true, maxLength: 2000 }), field("salaryAmount", "Salary", "0", { type: "decimal", required: true }), field("salaryCurrency", "Salary currency", "KES", { required: true, maxLength: 3 })] },
      { id: "credentials", title: "Initial sign-in", fields: [field("password", "Temporary password", "", { type: "password", required: true, maxLength: 128 }), field("confirmPassword", "Confirm temporary password", "", { type: "password", required: true, maxLength: 128 })] },
      { id: "assignment", title: "Caretaker assignment", description: "Required for caretakers. Choose a property or building; the server verifies it belongs to this organization.", fields: [field("assignmentTarget", "Assigned property or building", "", { type: "select", when: { field: "role", equals: "CARETAKER" }, options: [{ value: "", label: "Choose an assignment" }, ...targets] }), field("assignmentNotes", "Assignment notes", "", { type: "multiline", maxLength: 1000, when: { field: "role", equals: "CARETAKER" } }), field("assignmentIsPrimary", "Primary caretaker assignment", "", { type: "checkbox", when: { field: "role", equals: "CARETAKER" } })] },
    ] };
  }

  if (path === "/dashboard/org/staff" && recordId && (actionId === "staff.update" || actionId === "staff.deactivate")) {
    const requiredPermission = actionId === "staff.deactivate" ? "org.users.delete" : "org.users.manage";
    if (!memberHasOrgPermission(session, requiredPermission)) return null;
    const member = await prisma.membership.findFirst({
      where: { id: recordId, orgId: session.activeOrgId, role: { in: [...STAFF_ROLES] }, employmentEndedAt: null, user: { deletedAt: null } },
      select: { id: true, role: true, deactivatedAt: true, user: { select: { fullName: true, email: true, phone: true } }, staffProfile: { select: { salaryAmount: true, salaryCurrency: true, educationLevel: true, jobTitle: true, nationalId: true, emergencyContact: true, notes: true } } },
    });
    if (!member || member.deactivatedAt || member.role === "ADMIN" && session.activeOrgRole !== "ADMIN") return null;
    if (actionId === "staff.deactivate") return { id: actionId, title: `Deactivate ${member.user.fullName}`, description: "End this staff membership and revoke its active sessions. Caretaker assignments and lease links are cleared by the website workflow.", submitLabel: "Deactivate staff member", destructive: true, confirmation: `Type ${member.user.fullName} to confirm deactivation.`, groups: [{ id: "employment", title: "Employment end", fields: [field("confirmation", `Type ${member.user.fullName} to confirm`, "", { required: true, maxLength: 160 }), field("employmentEndedAt", "Employment end date", new Date().toISOString().slice(0, 10), { type: "date", required: true }), field("exitReason", "Reason for leaving", "", { required: true, maxLength: 500 }), field("deactivationNotes", "Internal notes", "", { type: "multiline", maxLength: 1500 }), field("disableLogin", "Disable this user login across all organizations", "", { type: "checkbox" })] }] };
    const roles = session.activeOrgRole === "ADMIN" ? STAFF_ROLES : STAFF_ROLES.filter(role => role !== "ADMIN");
    return { id: actionId, title: `Edit ${member.user.fullName}`, description: "Update staff contact and employment profile. Role changes follow the website's permission rules and clear extra grants when the role changes.", submitLabel: "Save staff profile", confirmation: "Save these staff details?", groups: [{ id: "profile", title: "Staff profile", fields: [field("fullName", "Full name", member.user.fullName, { required: true, maxLength: 120 }), field("email", "Email", member.user.email ?? "", { type: "email", maxLength: 180 }), field("phone", "Phone", member.user.phone ?? "", { type: "phone", maxLength: 40 }), field("role", "Role", member.role, { type: "select", required: true, options: roles.map(role => ({ value: role, label: role.replaceAll("_", " ") })) }), field("jobTitle", "Job title", member.staffProfile?.jobTitle ?? "", { maxLength: 120 }), field("educationLevel", "Education level", member.staffProfile?.educationLevel ?? "", { maxLength: 80 }), field("nationalId", "National ID / employee ID", member.staffProfile?.nationalId ?? "", { maxLength: 80 }), field("emergencyContact", "Emergency contact", member.staffProfile?.emergencyContact ?? "", { maxLength: 160 }), field("staffProfileNotes", "Staff profile notes", member.staffProfile?.notes ?? "", { type: "multiline", maxLength: 2000 }), field("salaryAmount", "Salary", member.staffProfile?.salaryAmount?.toString() ?? "", { type: "decimal" }), field("salaryCurrency", "Salary currency", member.staffProfile?.salaryCurrency ?? "KES", { required: true, maxLength: 3 })] }] };
  }

  if (path !== "/dashboard/org/staff/permissions" || actionId !== "staff.permissions.update" || !recordId || session.activeOrgRole !== "ADMIN") return null;

  const member = await prisma.membership.findFirst({
    where: {
      id: recordId,
      orgId: session.activeOrgId,
      role: { in: ["MANAGER", "OFFICE", "ACCOUNTANT"] },
      employmentEndedAt: null,
      deactivatedAt: null,
      user: { deletedAt: null, status: "ACTIVE" },
    },
    select: { role: true, grantedPermissions: true, user: { select: { fullName: true } } },
  });
  if (!member || !canReceiveOrgMandates(member.role)) return null;

  return {
    id: actionId,
    title: `Manage access · ${member.user.fullName}`,
    description: `Additional permissions for this ${member.role.toLowerCase()}. Standard role permissions remain in effect.`,
    submitLabel: "Save permissions",
    confirmation: `Save these additional permissions for ${member.user.fullName}? The change will be audited and the staff member notified.`,
    groups: [{
      id: "permissions",
      title: "Additional permissions",
      description: "Select only the extra powers this staff member needs. Inherited role access cannot be removed here.",
      fields: [
        { name: "permissions", label: "Granted permissions", type: "multiselect", defaultValue: JSON.stringify(member.grantedPermissions.filter(permission => permission !== "caretaker.fieldwork")), options: permissionOptions },
        { name: "note", label: "Reason for this change", type: "multiline", required: true, maxLength: 1000 },
      ],
    }],
  };
}

export async function executeNativeStaffAction(kind: "organization" | "platform", path: string, actionId: string, recordId: string | undefined, form: FormData) {
  if (kind === "organization" && path === "/dashboard/org/staff" && actionId === "staff.create") {
    const target = String(form.get("assignmentTarget") ?? "");
    const separator = target.indexOf(":");
    form.set("assignmentTargetType", separator > 0 ? target.slice(0, separator) : "");
    form.set("assignmentPropertyId", target.startsWith("PROPERTY:") ? target.slice(separator + 1) : "");
    form.set("assignmentBuildingId", target.startsWith("BUILDING:") ? target.slice(separator + 1) : "");
    form.delete("assignmentTarget");
    const result = await createMembership({ ok: false }, form);
    return result.ok && result.credentials
      ? { ok: true as const, message: "Staff account created. Share the temporary password securely; the staff member must change it at first sign-in.", credentials: { ...result.credentials, fullName: result.credentials.fullName, email: result.credentials.email ?? undefined, phone: result.credentials.phone ?? undefined } }
      : { error: result.message ?? "Could not create this staff member." };
  }
  if (kind === "organization" && path === "/dashboard/org/staff" && actionId === "staff.update" && recordId) {
    await updateMembership(recordId, form);
    return { ok: true as const, message: "Staff profile updated." };
  }
  if (kind === "organization" && path === "/dashboard/org/staff" && actionId === "staff.deactivate" && recordId) {
    form.set("membershipId", recordId);
    try { await deactivateMembershipAction(form); }
    catch (error) {
      const { isRedirectError } = await import("next/dist/client/components/redirect-error");
      const { getURLFromRedirectError } = await import("next/dist/client/components/redirect");
      if (isRedirectError(error) && new URL(getURLFromRedirectError(error) ?? "/", "https://estatedesk.invalid").pathname === "/staff/previous") return { ok: true as const, message: "Staff member deactivated and active sessions revoked." };
      throw error;
    }
    return { ok: true as const, message: "Staff member deactivated and active sessions revoked." };
  }
  if (kind !== "organization" || path !== "/dashboard/org/staff/permissions" || actionId !== "staff.permissions.update" || !recordId) return null;
  form.set("membershipId", recordId);
  const result = await updateStaffMandates(form);
  if (!result.ok) return { error: result.error || "Could not save staff permissions." };
  return { ok: true as const, message: "Staff permissions updated and recorded." };
}
