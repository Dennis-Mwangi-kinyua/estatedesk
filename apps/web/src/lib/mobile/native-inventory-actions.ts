import "server-only";
import type { AppSession } from "@/lib/auth/session";
import type { NativeActionDefinition, NativeActionField } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { nativeUnitScope } from "./native-workspace-policy";
import { updateUnitProfileAction } from "@/app/(app)/dashboard/org/units/[unitId]/unit-profile-actions";

const field = (name: string, label: string, value: unknown, extra: Partial<NativeActionField> = {}): NativeActionField => ({ name, label, type: "text", defaultValue: value === null || value === undefined ? "" : String(value), ...extra });
export const canEditNativeInventory = (session: AppSession) => !!session.activeOrgId && ["ADMIN", "MANAGER"].includes(session.activeOrgRole ?? "");

export async function nativeInventoryDefinition(session: AppSession, path: string, actionId: string, recordId?: string): Promise<NativeActionDefinition | null> {
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
  if (!await nativeInventoryDefinition(session, path, actionId, recordId)) return { error: "This unit is unavailable in your assigned scope." };
  return updateUnitProfileAction(recordId!, {}, form);
}
