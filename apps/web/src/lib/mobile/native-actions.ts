import "server-only";
import { nativeResolutionDefinition, nativeResolutionActions } from "./native-resolution-actions";
import { nativeOperatorPageActions, nativeOperatorRecordActions, nativeOperatorActionDefinition } from "./native-operator-actions";
import { nativeAgreementPageActions, nativeAgreementRecordActions, nativeAgreementActionDefinition } from "./native-agreement-actions";
import { nativeIdentityPageActions, nativeIdentityRecordActions, nativeIdentityActionDefinition } from "./native-identity-actions";
import type { AppSession } from "@/lib/auth/session";
import type { NativeActionDefinition, NativeActionField, NativeActionLink } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import { nativeOrgWideAccess } from "./native-workspace-policy";
import { PROPERTY_TYPES } from "@/features/properties/components/_lib/constants";
import { ALLOWED_UNIT_TYPES } from "@/features/properties/actions/_lib/parse-unit-plans";
import { nativeInventoryDefinition, nativeInventoryPageActions } from "./native-inventory-actions";
import { PlatformPermissionType } from "@prisma/client";
import { openingArrearsPeriods } from "@/lib/tenants/opening-arrears";
import { nativePlatformPageActions, nativePlatformRecordActions, nativePlatformActionDefinition } from "./native-platform-actions";
import { PLATFORM_FEATURE_FLAG_KEYS } from "@/app/(app)/platform/_lib/nav";
import { nativeStaffActionDefinition, nativeStaffPageActions } from "./native-staff-actions";
import { nativeTenantActionDefinition } from "./native-tenant-admin-actions";
import { nativeAccountingActionDefinition, nativeAccountingPageActions } from "./native-accounting-actions";
import { nativeBnbActionDefinition } from "./native-bnb-actions";
import { nativeVacancyInquiryDefinition } from "./native-vacancy-inquiry-actions";
import type { MobileWorkspaceKind } from "@estatedesk/contracts/mobile";
import { ONBOARDING_REQUEST_STATUSES } from "@/lib/platform/onboarding-status";

const text = (name: string, label: string, extra: Partial<NativeActionField> = {}): NativeActionField => ({ name, label, type: "text", ...extra });
const options = (values: readonly string[]) => values.map(value => ({ value, label: value.replaceAll("_", " ") }));

export function nativePageActions(session: AppSession, kind: MobileWorkspaceKind, path: string): NativeActionLink[] {
  if (kind === "landlord") return [];
  const staff = nativeStaffPageActions(session, kind, path);
  if (staff.length) return staff;
  const accounting = nativeAccountingPageActions(session, kind, path);
  if (accounting.length) return accounting;
  const inventory = kind === "organization" ? nativeInventoryPageActions(session, path) : [];
  if (inventory.length) return inventory;
  const agreement = nativeAgreementPageActions(kind, path);
  if (agreement.length) return agreement;
  const identity = nativeIdentityPageActions(session, kind, path);
  if (identity.length) return identity;
  if (kind === "platform") {
    const additional = [...nativeOperatorPageActions(path), ...nativePlatformPageActions(path)];
    if (path === "/platform/users") return [{ id: "user.create", title: "New user" }];
    if (path === "/platform/marketing") return [{ id: "marketer.create", title: "New marketer" }, ...additional];
    if (path === "/platform/backups") return [{ id: "backup.checkpoint", title: "Record backup checkpoint" }, { id: "backup.drill", title: "Record restore drill" }];
    if (path === "/platform/rate-limits") return [{ id: "rate.expired", title: "Clear expired buckets" }, { id: "rate.scope", title: "Clear rate-limit scope", destructive: true }];
    return additional;
  }
  if (!nativeOrgWideAccess(session.membershipScope)) return [];
  if (path === "/dashboard/org/properties" && memberHasOrgPermission(session, "properties.manage")) return [{ id: "property.create", title: "New property" }];
  if (path === "/dashboard/org/tenants" && memberHasOrgPermission(session, "tenants.manage")) return [{ id: "tenant.create", title: "New tenant" }];
  if (path === "/dashboard/org/support") return [{ id: "support.send", title: "Message platform support" }];
  if (path === "/dashboard/org/community" && ["ADMIN", "MANAGER", "OFFICE"].includes(session.activeOrgRole ?? "")) return [{ id: "community.publish", title: "Publish notice" }];
  return [];
}

export function nativeRecordActions(kind: MobileWorkspaceKind, path: string, status?: string): NativeActionLink[] {
  if (kind === "landlord") return [];
  if (kind === "organization" && path === "/dashboard/org/airbnb") return [];
  if (kind === "organization" && path === "/dashboard/org/issues/resolution-reports") return nativeResolutionActions(status);
  const agreement = nativeAgreementRecordActions(kind, path, status);
  if (agreement.length) return agreement;
  const identity = nativeIdentityRecordActions(kind, path, status);
  if (identity.length) return identity;
  if (kind !== "platform") return [];
  const additional = [...nativeOperatorRecordActions(path, status), ...nativePlatformRecordActions(path, status)];
  if (additional.length) return additional;
  if (path === "/platform/feature-flags") return [{ id: "feature.update", title: "Update feature flag" }];
  if (path === "/platform/marketing") return [{ id: "marketer.update", title: "Edit marketer" }];
  if (path === "/platform/onboarding") return [{ id: "onboarding.update", title: "Update request" }, { id: "onboarding.delete", title: "Delete request", destructive: true }];
  if (path !== "/platform/messages") return [];
  return [
    ...status === "OPEN" ? [{ id: "message.read", title: "Mark read" }] : [],
    ...["OPEN", "READ"].includes(status ?? "") ? [{ id: "message.close", title: "Close" }] : [],
    ...["CLOSED", "SPAM"].includes(status ?? "") ? [{ id: "message.reopen", title: "Reopen" }] : [],
    ...status !== "SPAM" ? [{ id: "message.spam", title: "Mark spam" }] : [],
    { id: "message.delete", title: "Delete message", destructive: true },
  ];
}

export async function nativeActionDefinition(session: AppSession, kind: MobileWorkspaceKind, path: string, actionId: string, recordId?: string): Promise<NativeActionDefinition | null> {
  if (kind === "landlord") return null;
  const bnb = await nativeBnbActionDefinition(session, path, actionId, recordId);
  if (bnb) return bnb;
  const inquiry = await nativeVacancyInquiryDefinition(session, path, actionId, recordId);
  if (inquiry) return inquiry;
  const accounting = await nativeAccountingActionDefinition(session, kind, path, actionId, recordId);
  if (accounting) return accounting;
  const tenant = await nativeTenantActionDefinition(session, kind, path, actionId, recordId);
  if (tenant) return tenant;
  const staff = await nativeStaffActionDefinition(session, kind, path, actionId, recordId);
  if (staff) return staff;
  if (kind === "organization" && actionId.startsWith("resolution.")) return nativeResolutionDefinition(session, path, actionId, recordId);
  if (kind === "organization" && (actionId === "unit.edit" || actionId.startsWith("inventory."))) return nativeInventoryDefinition(session, path, actionId, recordId);
  if (kind === "platform" && (actionId.startsWith("provider.") || actionId.startsWith("attribution.") || actionId.startsWith("organization.access."))) return nativeOperatorActionDefinition(session, path, actionId, recordId);
  if (actionId.startsWith("agreement.")) return nativeAgreementActionDefinition(session, kind, path, actionId, recordId);
  if (actionId.startsWith("identity.")) return nativeIdentityActionDefinition(session, kind, path, actionId, recordId);
  if (kind === "platform") { const additional = await nativePlatformActionDefinition(session, path, actionId, recordId); if (additional) return additional; }
  const pageAction = nativePageActions(session, kind, path).find(action => action.id === actionId);
  if (pageAction?.id === "tenant.create") {
    const units = await prisma.unit.findMany({ where: { deletedAt: null, isActive: true, status: "VACANT", property: { orgId: session.activeOrgId!, deletedAt: null } }, orderBy: [{ property: { name: "asc" } }, { houseNo: "asc" }], select: { id: true, houseNo: true, type: true, rentAmount: true, depositAmount: true, property: { select: { name: true } }, building: { select: { name: true } } } });
    return { id: actionId, title: "New tenant", description: "Create the tenant account, next of kin, unit allocation and lease using the website's onboarding transaction.", submitLabel: "Create tenant account", confirmation: "Create this tenant account and any selected unit allocation, lease and opening balances?", groups: [
      { id: "tenant", title: "Tenant details", fields: [text("fullName", "Full name", { required: true, maxLength: 120 }), text("phone", "Phone", { type: "phone", required: true, maxLength: 30 }), text("email", "Email", { type: "email", maxLength: 120 }), text("nationalId", "National ID"), text("kraPin", "KRA PIN"), text("status", "Status", { type: "select", defaultValue: "ACTIVE", options: options(["ACTIVE", "INACTIVE", "BLACKLISTED"]) }), text("notes", "Notes", { type: "multiline" })] },
      { id: "kin", title: "Next of kin", fields: [text("nextOfKinName", "Next of kin name", { required: true }), text("nextOfKinRelationship", "Relationship", { required: true }), text("nextOfKinPhone", "Next of kin phone", { type: "phone", required: true }), text("nextOfKinEmail", "Next of kin email", { type: "email" })] },
      { id: "account", title: "Account details", fields: [text("username", "Username", { required: true, maxLength: 30 }), text("password", "Password", { type: "password", required: true }), text("confirmPassword", "Confirm password", { type: "password", required: true })] },
      { id: "allocation", title: "Unit & lease", description: "Assign a vacant unit or leave it unassigned. Blank rent/deposit overrides use the unit's amounts. Existing leases require their original start date and do not recreate initial charges.", fields: [
        text("unitId", "Assign unit", { type: "select", options: [{ value: "", label: "No unit assigned" }, ...units.map(row => ({ value: row.id, label: `${row.property.name} / ${row.building?.name ?? ""} / ${row.houseNo} · Rent ${row.rentAmount} · Deposit ${row.depositAmount ?? "—"}` }))] }),
        text("leaseStartDate", "Lease start date", { type: "date" }), text("dueDay", "Rent due day", { type: "integer", defaultValue: "5" }), text("monthlyRent", "Monthly rent override", { type: "decimal" }), text("deposit", "Deposit override", { type: "decimal" }), text("existingLease", "Onboard an existing lease", { type: "checkbox" }),
        ...openingArrearsPeriods().map(period => text(`openingArrears:${period}`, `Previous balance for ${period}`, { type: "decimal", when: { field: "existingLease", equals: "on" } })),
      ] },
    ] };
  }
  if (pageAction?.id === "support.send") return { id: actionId, title: "Message platform support", description: "Send the same support message as the organization support workspace.", submitLabel: "Send message", confirmation: "Send this message to platform support?", groups: [{ id: "message", title: "Your message", fields: [text("subject", "Subject", { required: true }), text("message", "Message", { type: "multiline", required: true })] }] };
  if (pageAction?.id === "user.create") return { id: actionId, title: "New platform user", description: "Create a platform account with its selected role and explicit grants.", submitLabel: "Create user", confirmation: "Create this account with the selected platform access?", groups: [
    { id: "account", title: "Account", fields: [text("fullName", "Full name", { required: true }), text("username", "Username", { required: true, maxLength: 30 }), text("email", "Email", { type: "email", required: true }), text("phone", "Phone", { type: "phone" }), text("password", "Password", { type: "password", required: true }), text("confirmPassword", "Confirm password", { type: "password", required: true })] },
    { id: "access", title: "Role & permissions", fields: [text("platformRole", "Platform role", { type: "select", defaultValue: "USER", options: options(session.platformRole === "SUPER_ADMIN" ? ["USER", "PLATFORM_ADMIN", "SUPER_ADMIN"] : ["USER", "PLATFORM_ADMIN"]) }), text("canCreatePlatformAdmins", "Can create platform admins", { type: "checkbox" }), text("permissions", "Explicit permissions", { type: "multiselect", defaultValue: "[]", options: options(Object.values(PlatformPermissionType)) })] },
  ] };
  if (pageAction?.id === "marketer.create") return { id: actionId, title: "New marketer", description: "Register a marketer and their referral commission.", submitLabel: "Create marketer", confirmation: "Create this marketer and referral code?", groups: [{ id: "marketer", title: "Marketer details", fields: [text("fullName", "Full name", { required: true, maxLength: 120 }), text("email", "Email", { type: "email", maxLength: 160 }), text("phone", "Phone", { type: "phone", maxLength: 40 }), text("referralCode", "Referral code", { required: true, maxLength: 40 }), text("defaultCommissionRate", "Default commission rate (%)", { type: "decimal", required: true, defaultValue: "0" }), text("notes", "Notes", { type: "multiline", maxLength: 1000 })] }] };
  if (pageAction?.id.startsWith("backup.")) return { id: actionId, title: pageAction.title, description: "Record evidence from an actual backup or restore drill. This does not run a backup or restore.", submitLabel: pageAction.title, confirmation: "Save this operational evidence to the platform audit trail?", groups: [{ id: "evidence", title: "Evidence", fields: [
    ...actionId === "backup.checkpoint" ? [text("status", "Checkpoint status", { type: "select", required: true, defaultValue: "Review", options: options(["Ready", "Review", "Failed"]) })] : [], text("note", "Evidence note (at least 10 characters)", { type: "multiline", required: true, maxLength: 2000 }),
  ] }] };
  if (pageAction?.id.startsWith("rate.")) return { id: actionId, title: pageAction.title, description: "Apply the platform rate-limit maintenance action.", submitLabel: pageAction.title, confirmation: actionId === "rate.scope" ? "Clear all rate-limit buckets matching this scope? This resets their counters." : "Remove expired rate-limit buckets?", destructive: actionId === "rate.scope", groups: actionId === "rate.scope" ? [{ id: "scope", title: "Rate-limit scope", fields: [text("scope", "Scope prefix", { required: true })] }] : [] };
  if (pageAction?.id === "property.create") {
    const [taxpayers, landlords] = await Promise.all([
      prisma.taxpayerProfile.findMany({ where: { orgId: session.activeOrgId!, deletedAt: null, isActive: true }, orderBy: { displayName: "asc" }, select: { id: true, displayName: true, kraPin: true, kind: true } }),
      prisma.landlordProfile.findMany({ where: { orgId: session.activeOrgId!, deletedAt: null, isActive: true }, orderBy: { displayName: "asc" }, select: { id: true, displayName: true, phone: true, email: true } }),
    ]);
    const newLandlord = { field: "landlordMode", equals: "new" };
    return { id: actionId, title: "New property", description: "Create the property, link ownership, configure billing and generate its units using the same workflow as the website.", submitLabel: "Create property", confirmation: "Create this property, its planned units and any new landlord account? Review all details before submitting.", groups: [
      { id: "profile", title: "Property profile", fields: [
        text("name", "Property name", { required: true, maxLength: 120 }),
        text("type", "Property type", { type: "select", defaultValue: "RESIDENTIAL", required: true, options: [...PROPERTY_TYPES] }),
        text("taxpayerProfileId", "Taxpayer profile", { type: "select", options: [{ value: "", label: "No linked taxpayer profile" }, ...taxpayers.map(row => ({ value: row.id, label: `${row.displayName} · ${row.kraPin} (${row.kind})` }))] }),
        text("location", "Location", { maxLength: 160 }), text("address", "Address", { maxLength: 220 }), text("notes", "Notes", { type: "multiline", maxLength: 1500 }),
      ] },
      { id: "landlord", title: "Landlord ownership", fields: [
        text("landlordMode", "Landlord option", { type: "select", defaultValue: "none", options: [{ value: "none", label: "No landlord" }, { value: "existing", label: "Existing landlord" }, { value: "new", label: "New landlord" }] }),
        text("existingLandlordProfileId", "Select landlord", { type: "select", required: true, when: { field: "landlordMode", equals: "existing" }, options: [{ value: "", label: "Choose landlord" }, ...landlords.map(row => ({ value: row.id, label: [row.displayName, row.phone, row.email].filter(Boolean).join(" · ") }))] }),
        text("landlordFullName", "Landlord full name", { required: true, when: newLandlord }), text("landlordUsername", "Landlord username", { required: true, when: newLandlord }),
        text("landlordPassword", "Landlord password", { type: "password", required: true, when: newLandlord }), text("landlordEmail", "Landlord email", { type: "email", when: newLandlord }),
        text("landlordPhone", "Landlord phone", { type: "phone", when: newLandlord }), text("landlordNationalId", "Landlord national ID", { when: newLandlord }), text("landlordNotes", "Landlord notes", { type: "multiline", when: newLandlord }),
      ] },
      { id: "billing", title: "Billing & availability", fields: [text("waterRatePerUnit", "Water rate per unit", { type: "decimal" }), text("waterFixedCharge", "Water fixed charge", { type: "decimal" }), text("isActive", "Active on creation", { type: "checkbox", defaultValue: "on" })] },
      { id: "units", title: "Unit mix", description: "Add each unit type to generate its units automatically. Prefixes and start numbers must produce unique house numbers.", repeat: true, fields: [
        text("unitPlanUnitType[]", "Unit type", { type: "select", required: true, defaultValue: "APARTMENT", options: options(ALLOWED_UNIT_TYPES) }),
        text("unitPlanBedrooms[]", "Bedrooms", { type: "select", required: true, defaultValue: "1", when: { field: "unitPlanUnitType[]", equals: "APARTMENT" }, options: options(["1", "2", "3", "4"]) }),
        text("unitPlanBathrooms[]", "Bathrooms", { type: "integer" }), text("unitPlanQuantity[]", "Quantity", { type: "integer", required: true, defaultValue: "1" }),
        text("unitPlanDefaultRentAmount[]", "Default rent", { type: "decimal", required: true }), text("unitPlanDefaultDepositAmount[]", "Default deposit", { type: "decimal" }),
        text("unitPlanHouseNoPrefix[]", "House number prefix"), text("unitPlanStartNumber[]", "Start number", { type: "integer", defaultValue: "1", required: true }), text("unitPlanLabel[]", "Label"), text("unitPlanNotes[]", "Unit mix notes", { type: "multiline" }),
      ] },
    ] };
  }
  if (pageAction?.id === "community.publish") {
    const [properties, leases] = await Promise.all([
      prisma.property.findMany({ where: { orgId: session.activeOrgId!, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.lease.findMany({ where: { orgId: session.activeOrgId!, status: "ACTIVE", deletedAt: null, tenant: { deletedAt: null }, unit: { deletedAt: null } }, select: { tenantId: true, tenant: { select: { fullName: true } }, unit: { select: { houseNo: true, property: { select: { name: true } } } } } }),
    ]);
    return { id: actionId, title: "Publish community notice", description: "Publish an official notice to current occupants or a selected tenant.", submitLabel: "Publish notice", confirmation: "Publish this notice and notify the selected recipients?", groups: [{ id: "notice", title: "Notice & recipients", fields: [
      text("propertyId", "Property", { type: "select", required: true, options: [{ value: "", label: "Choose property" }, ...properties.map(row => ({ value: row.id, label: row.name }))] }),
      text("targetTenantId", "Recipients", { type: "select", options: [{ value: "", label: "All current occupants of the property" }, ...leases.map(row => ({ value: row.tenantId, label: `${row.tenant.fullName} · ${row.unit.property.name} / ${row.unit.houseNo}` }))] }),
      text("title", "Notice title", { required: true, maxLength: 160 }), text("message", "Message", { type: "multiline", required: true, maxLength: 6000 }),
    ] }] };
  }
  if (kind !== "platform" || !recordId) return null;
  if (path === "/platform/feature-flags" && actionId === "feature.update") {
    const row = await prisma.organization.findFirst({ where: { id: recordId, deletedAt: null }, select: { name: true } });
    if (!row) return null;
    return { id: actionId, title: "Update organization feature", description: row.name, submitLabel: "Update feature", confirmation: `Change this feature for ${row.name}?`, groups: [{ id: "feature", title: "Feature setting", fields: [text("featureKey", "Feature", { type: "select", required: true, options: options(PLATFORM_FEATURE_FLAG_KEYS) }), text("nextEnabled", "Enabled", { type: "select", required: true, options: [{ value: "true", label: "Enabled" }, { value: "false", label: "Disabled" }] })] }] };
  }
  if (path === "/platform/marketing" && actionId === "marketer.update") {
    const row = await prisma.platformMarketer.findUnique({ where: { id: recordId }, select: { fullName: true, status: true, defaultCommissionRate: true, notes: true } });
    if (!row) return null;
    return { id: actionId, title: "Edit marketer", description: row.fullName, submitLabel: "Save marketer", confirmation: `Save changes for ${row.fullName}?`, groups: [{ id: "marketer", title: "Status & commission", fields: [text("status", "Status", { type: "select", defaultValue: row.status, options: options(["ACTIVE", "INACTIVE"]) }), text("defaultCommissionRate", "Commission rate (%)", { type: "decimal", required: true, defaultValue: String(row.defaultCommissionRate) }), text("notes", "Notes", { type: "multiline", defaultValue: row.notes ?? "" })] }] };
  }
  if (path === "/platform/onboarding" && ["onboarding.update", "onboarding.delete"].includes(actionId)) {
    const row = await prisma.onboardingRequest.findUnique({ where: { id: recordId }, select: { companyName: true, status: true, internalNotes: true } });
    if (!row) return null;
    const destructive = actionId === "onboarding.delete";
    return { id: actionId, title: destructive ? "Delete onboarding request" : "Update onboarding request", description: row.companyName, submitLabel: destructive ? "Delete request" : "Save request", destructive, confirmation: destructive ? `Permanently delete the onboarding request for ${row.companyName}?` : `Save the status and internal notes for ${row.companyName}?`, groups: destructive ? [] : [{ id: "request", title: "Status & follow-up", fields: [
      text("status", "Status", { type: "select", required: true, defaultValue: row.status, options: options(ONBOARDING_REQUEST_STATUSES) }), text("internalNotes", "Internal notes", { type: "multiline", defaultValue: row.internalNotes ?? "" }),
    ] }] };
  }
  if (path === "/platform/messages") {
    const row = await prisma.platformMessage.findUnique({ where: { id: recordId }, select: { subject: true, status: true } });
    const action = row && nativeRecordActions(kind, path, row.status).find(item => item.id === actionId);
    if (!action || !row) return null;
    return { id: actionId, title: action.title, description: row.subject, submitLabel: action.title, destructive: action.destructive, confirmation: `${action.title}: ${row.subject}?${action.destructive ? " This permanently removes the message." : ""}`, groups: [] };
  }
  return null;
}
