"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { writeAuditLog } from "@/lib/audit/security";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";

export type UnitRenameState = { status: "idle" | "error" | "success"; message?: string };
class RenameError extends Error {}
const entrySchema = z.object({ id: z.string().min(1).max(191), previous: z.string().max(500), name: z.string().trim().min(1).max(80).regex(/^[^\x00-\x1f\x7f]+$/) });

export async function renameUnitsAction(_state: UnitRenameState, formData: FormData): Promise<UnitRenameState> {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  if (!session.activeOrgId) return { status: "error", message: "Select an organisation first." };
  const propertyId = formData.get("propertyId");
  if (typeof propertyId !== "string" || !propertyId || propertyId.length > 191) return { status: "error", message: "Choose a property to rename its units." };
  let entries: z.infer<typeof entrySchema>[];
  try {
    const raw = formData.get("changes");
    if (typeof raw !== "string" || raw.length > 200_000) throw new Error();
    entries = z.array(entrySchema).min(1).max(500).parse(JSON.parse(raw));
    if (new Set(entries.map(entry=>entry.id)).size !== entries.length) throw new Error();
  } catch { return { status: "error", message: "Check the unit names. Use 1–80 characters per name and rename up to 500 units at a time." }; }

  try {
    const result = await prisma.$transaction(async tx => {
      const property = await tx.property.findFirst({ where: { id: propertyId, orgId: session.activeOrgId!, deletedAt: null }, select: { id: true, name: true } });
      if (!property) throw new RenameError("This property is not available in your organisation.");
      const units = await tx.unit.findMany({ where: { propertyId: property.id, deletedAt: null }, select: { id: true, houseNo: true, buildingId: true, publicSlug: true } });
      const byId = new Map(units.map(unit=>[unit.id,unit]));
      const proposed = new Map(entries.map(entry=>[entry.id,entry.name]));
      for (const entry of entries) {
        const unit = byId.get(entry.id);
        if (!unit) throw new RenameError("One of these units is no longer available on this property. Refresh and try again.");
        if (unit.houseNo !== entry.previous) throw new RenameError("A unit name changed while you were editing. Refresh the page before trying again.");
        const finalKey = entry.name.toLocaleLowerCase("en");
        if (units.some(other=>other.id !== unit.id && other.buildingId === unit.buildingId && (proposed.get(other.id) ?? other.houseNo).trim().toLocaleLowerCase("en") === finalKey)) throw new RenameError(`The name ${entry.name} is already used in this building or standalone group. Choose a different name.`);
      }
      for (const entry of entries) await tx.unit.update({ where: { id: entry.id, propertyId: property.id, deletedAt: null }, data: { houseNo: entry.name } });
      return { property, before: entries.map(entry=>({ id: entry.id, houseNo: entry.previous })), after: entries.map(entry=>({ id: entry.id, houseNo: entry.name })), units: entries.map(entry=>({...byId.get(entry.id)!, name: entry.name})) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20_000 });
    await writeAuditLog({ orgId: session.activeOrgId, actorUserId: session.userId, action: "UNIT_NAMES_UPDATED", entityType: "Property", entityId: propertyId, beforeState: { units: result.before }, afterState: { units: result.after } });
    revalidatePath("/", "layout");
    for (const unit of result.units) {
      revalidatePublicVacancies({ propertyName: result.property.name, houseNo: unit.houseNo, publicSlug: unit.publicSlug });
      revalidatePublicVacancies({ propertyName: result.property.name, houseNo: unit.name, publicSlug: unit.publicSlug });
    }
    return { status: "success", message: `${entries.length} unit ${entries.length === 1 ? "name" : "names"} updated.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return { status: "error", message: "The units changed during saving. Refresh the page and try again." };
    return { status: "error", message: error instanceof RenameError ? error.message : "Could not rename the units. Please try again." };
  }
}
