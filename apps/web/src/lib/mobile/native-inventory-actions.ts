import "server-only";
import type { AppSession } from "@/lib/auth/session";
import type { NativeActionDefinition, NativeActionField } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { nativeOrgWideAccess, nativeUnitScope } from "./native-workspace-policy";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import { updateUnitProfileAction } from "@/app/(app)/dashboard/org/units/[unitId]/unit-profile-actions";
import { deleteUnitAction } from "@/app/(app)/dashboard/org/units/actions";
import { deleteBuildingAction } from "@/app/(app)/dashboard/org/buildings/actions";
import { createUnitAction } from "@/app/(app)/dashboard/org/properties/[propertyId]/units/new/actions";

const field = (name: string, label: string, value: unknown, extra: Partial<NativeActionField> = {}): NativeActionField => ({ name, label, type: "text", defaultValue: value === null || value === undefined ? "" : String(value), ...extra });
export const canEditNativeInventory = (session: AppSession) => !!session.activeOrgId && ["ADMIN", "MANAGER"].includes(session.activeOrgRole ?? "");

export function nativeInventoryPageActions(session: AppSession, path: string) {
  return path === "/dashboard/org/units" && nativeOrgWideAccess(session.membershipScope) && memberHasOrgPermission(session, "properties.manage")
    ? [{ id: "inventory.unit.create", title: "Add unit" }]
    : [];
}

export async function nativeInventoryDefinition(session: AppSession, path: string, actionId: string, recordId?: string): Promise<NativeActionDefinition | null> {
  if (!recordId && path === "/dashboard/org/units" && actionId === "inventory.unit.create" && nativeOrgWideAccess(session.membershipScope) && memberHasOrgPermission(session, "properties.manage")) {
    const [properties, buildings] = await Promise.all([
      prisma.property.findMany({ where: { orgId: session.activeOrgId!, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.building.findMany({ where: { deletedAt: null, property: { orgId: session.activeOrgId!, deletedAt: null } }, orderBy: { name: "asc" }, select: { id: true, name: true, propertyId: true } }),
    ]);
    return { id: actionId, title: "Add a unit", description: "Create one unit under a property. The server checks your unit limit, property, building and duplicate unit number.", submitLabel: "Create unit", confirmation: "Add this unit to the selected property? Check its status and rental amounts before saving.", groups: [{ id: "unit", title: "Unit details", fields: [
      field("propertyId", "Property", "", { type: "select", required: true, options: properties.map(row => ({ value: row.id, label: row.name })) }),
      field("buildingId", "Building / block (optional)", "", { type: "select", options: [{ value: "", label: "No building" }, ...buildings.map(row => ({ value: row.id, label: `${row.name} · ${properties.find(property => property.id === row.propertyId)?.name ?? "Property"}` }))] }),
      field("houseNo", "Unit or house number", "", { required: true, maxLength: 80 }),
      field("type", "Unit type", "APARTMENT", { type: "select", required: true, options: ["APARTMENT", "BEDSITTER", "SHOP", "OFFICE", "STALL", "WAREHOUSE", "GODOWN", "STUDIO", "SINGLE_ROOM"].map(value => ({ value, label: value.replaceAll("_", " ") })) }),
      field("status", "Availability", "VACANT", { type: "select", required: true, options: ["VACANT", "OCCUPIED", "RESERVED", "UNDER_MAINTENANCE"].map(value => ({ value, label: value.replaceAll("_", " ") })) }),
      field("bedrooms", "Bedrooms", "", { type: "integer" }), field("bathrooms", "Bathrooms", "", { type: "integer" }), field("floorArea", "Floor area", "", { type: "decimal" }),
      field("rentAmount", "Monthly rent", "0", { type: "decimal", required: true }), field("depositAmount", "Deposit", "", { type: "decimal" }),
      field("vacantSince", "Vacant since (optional)", "", { type: "date" }), field("isActive", "Active", "on", { type: "checkbox" }), field("notes", "Notes", "", { type: "multiline", maxLength: 5000 }),
    ] }] };
  }
  if (!recordId || !canEditNativeInventory(session)) return null;
  if (path === "/dashboard/org/units" && actionId === "inventory.unit.delete") {
    const unit = await prisma.unit.findFirst({
      where: { AND: [nativeUnitScope(session.activeOrgId!, session.membershipScope), { id: recordId, deletedAt: null }] },
      select: { houseNo: true, leases: { where: { deletedAt: null, status: { in: ["ACTIVE", "PENDING"] } }, select: { id: true }, take: 1 } },
    });
    if (!unit || unit.leases.length) return null;
    return { id: actionId, title: `Delete unit ${unit.houseNo}`, description: "Remove this vacant unit from the portfolio. This action cannot be undone from the app.", submitLabel: "Delete unit", destructive: true, confirmation: `Permanently remove vacant unit ${unit.houseNo}?`, groups: [] };
  }
  if (path === "/dashboard/org/buildings" && actionId === "inventory.building.delete" && nativeOrgWideAccess(session.membershipScope)) {
    const building = await prisma.building.findFirst({
      where: { id: recordId, deletedAt: null, property: { orgId: session.activeOrgId!, deletedAt: null } },
      select: { name: true, units: { where: { deletedAt: null, leases: { some: { deletedAt: null, status: { in: ["ACTIVE", "PENDING"] } } } }, select: { id: true }, take: 1 } },
    });
    if (!building || building.units.length) return null;
    return { id: actionId, title: `Delete building ${building.name}`, description: "Remove this building and its vacant units from the portfolio.", submitLabel: "Delete building", destructive: true, confirmation: `Delete ${building.name} and its units? Buildings with active or pending leases cannot be deleted.`, groups: [] };
  }
  if (path !== "/dashboard/org/units" || actionId !== "unit.edit" || !recordId || !canEditNativeInventory(session)) return null;
  const unit = await prisma.unit.findFirst({ where: { AND: [nativeUnitScope(session.activeOrgId!, session.membershipScope), { id: recordId }] }, select: {
    id: true, houseNo: true, updatedAt: true, sequenceNo: true, type: true, bedrooms: true, bathrooms: true, roomCount: true, floorArea: true,
    rentAmount: true, depositAmount: true, serviceCharge: true, garbageFee: true, securityFee: true, electricityBilling: true, hasBalcony: true, notes: true, property: { select: { name: true } },
  } });
  // Retain the native scope even though the web transaction rechecks organization and role.
  if (!unit) return null;
  const number = (name: keyof typeof unit, label: string, decimal = false) => field(name, label, unit[name], { type: decimal ? "decimal" : "integer" });
  return { id: actionId, title: `Edit unit ${unit.houseNo}`, description: unit.property.name, submitLabel: "Save unit", confirmation: "Save this unit profile and its advertised rental amounts? Existing lease terms are managed separately.", groups: [
    { id: "profile", title: "Unit details", fields: [field("expectedUpdatedAt", "Record version", unit.updatedAt.toISOString(), { type: "hidden", required: true }), field("houseNo", "Unit name or number", unit.houseNo, { required: true, maxLength: 80 }), number("sequenceNo", "Sequence number"), field("type", "Unit type", unit.type, { type: "select", required: true, options: ["APARTMENT", "BEDSITTER", "SHOP", "OFFICE", "STALL", "WAREHOUSE", "GODOWN", "STUDIO", "SINGLE_ROOM"].map(value => ({ value, label: value.replaceAll("_", " ") })) }), number("bedrooms", "Bedrooms"), number("bathrooms", "Bathrooms"), number("roomCount", "Rooms"), number("floorArea", "Floor area", true), field("hasBalcony", "Has balcony", unit.hasBalcony ? "on" : "", { type: "checkbox" })] },
    { id: "charges", title: "Rental amounts & utilities", fields: [field("rentAmount", "Monthly advertised rent", unit.rentAmount, { type: "decimal", required: true }), number("depositAmount", "Deposit", true), number("serviceCharge", "Service charge", true), number("garbageFee", "Garbage fee", true), number("securityFee", "Security fee", true), field("electricityBilling", "Electricity billing", unit.electricityBilling, { type: "select", options: ["", "Prepay", "Postpay", "Included"].map(value => ({ value, label: value || "Unspecified" })) }), field("notes", "Notes", unit.notes, { type: "multiline", maxLength: 5000 })] },
  ] };
}
export async function executeNativeInventoryAction(session: AppSession, path: string, actionId: string, recordId: string | undefined, form: FormData) {
  if (!recordId && path === "/dashboard/org/units" && actionId === "inventory.unit.create") {
    if (!await nativeInventoryDefinition(session, path, actionId)) return { error: "Unit creation is unavailable for your workspace." };
    await createUnitAction(form);
    return { message: "Unit created." };
  }
  if (recordId && path === "/dashboard/org/units" && actionId === "inventory.unit.delete") {
    if (!await nativeInventoryDefinition(session, path, actionId, recordId)) return { error: "This vacant unit is unavailable for deletion." };
    form.set("unitId", recordId);
    await deleteUnitAction(form);
    return { message: "Unit deleted." };
  }
  if (recordId && path === "/dashboard/org/buildings" && actionId === "inventory.building.delete") {
    if (!await nativeInventoryDefinition(session, path, actionId, recordId)) return { error: "This vacant building is unavailable for deletion." };
    form.set("buildingId", recordId);
    await deleteBuildingAction(form);
    return { message: "Building deleted." };
  }
  if (!await nativeInventoryDefinition(session, path, actionId, recordId)) return { error: "This unit is unavailable in your assigned scope." };
  return updateUnitProfileAction(recordId!, {}, form);
}
