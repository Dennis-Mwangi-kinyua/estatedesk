




import "server-only";




import type { AppSession } from "@/lib/auth/session";
import type { MobileWorkspaceKind, NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";















import { card } from "./native-records-display";
export async function nativeLandlordRecords(session: AppSession, kind: MobileWorkspaceKind, path: string, q: string, page: number, recordId?: string): Promise<{ records: NativeWorkspaceRecord[]; notice?: string; searchable?: boolean; hasMore?: boolean } | undefined> {
  const orgId = session.activeOrgId!;
  const limit = { skip: (page - 1) * 25, take: 26 };
  const contains = { contains: q, mode: "insensitive" as const };
  const section = path === "/api-keys" ? "api-keys" : path.replace(kind === "platform" ? /^\/platform\/?/ : kind === "landlord" ? /^\/dashboard\/landlord\/?/ : /^\/dashboard\/org\/?/, "");
if (kind === "landlord") {
    if (session.activeOrgRole !== "LANDLORD" || !orgId) return { records: [], notice: "Landlord workspace access is unavailable." };
    const profile = await prisma.landlordProfile.findFirst({
      where: { orgId, userId: session.userId, deletedAt: null, isActive: true },
      select: {
        id: true, displayName: true,
        assignments: {
          where: { orgId, active: true, endedAt: null, OR: [{ property: { orgId, deletedAt: null, isActive: true } }, { unit: { deletedAt: null, isActive: true, property: { orgId, deletedAt: null, isActive: true } } }] },
          select: {
            property: { select: {
              id: true, name: true, location: true, address: true,
              units: { where: { deletedAt: null, isActive: true }, select: {
                id: true, houseNo: true, status: true, rentAmount: true,
                leases: { where: { deletedAt: null, status: "ACTIVE" }, take: 1, select: { startDate: true, endDate: true, monthlyRent: true, tenant: { select: { fullName: true } } } },
              } },
            } },
            unit: { select: {
              id: true, houseNo: true, status: true, rentAmount: true,
              property: { select: { id: true, name: true, location: true, address: true } },
              leases: { where: { deletedAt: null, status: "ACTIVE" }, take: 1, select: { startDate: true, endDate: true, monthlyRent: true, tenant: { select: { fullName: true } } } },
            } },
          },
        },
      },
    });
    if (!profile) return { records: [], notice: "No active landlord profile is linked to this account." };
    const properties = new Map<string, { name: string; location: string | null; address: string | null; units: Map<string, { houseNo: string; status: string; rent: number; tenant: string | null; leaseStart: Date | null; leaseEnd: Date | null; leaseRent: number | null }> }>();
    for (const assignment of profile.assignments) {
      const property = assignment.property ?? assignment.unit?.property;
      if (!property) continue;
      const entry = properties.get(property.id) ?? { name: property.name, location: property.location, address: property.address, units: new Map() };
      if (assignment.property && !assignment.unit) for (const unit of assignment.property.units) { const lease = unit.leases[0]; entry.units.set(unit.id, { houseNo: unit.houseNo, status: unit.status, rent: Number(unit.rentAmount), tenant: lease?.tenant.fullName ?? null, leaseStart: lease?.startDate ?? null, leaseEnd: lease?.endDate ?? null, leaseRent: lease ? Number(lease.monthlyRent) : null }); }
      if (assignment.unit) { const unit = assignment.unit, lease = unit.leases[0]; entry.units.set(unit.id, { houseNo: unit.houseNo, status: unit.status, rent: Number(unit.rentAmount), tenant: lease?.tenant.fullName ?? null, leaseStart: lease?.startDate ?? null, leaseEnd: lease?.endDate ?? null, leaseRent: lease ? Number(lease.monthlyRent) : null }); }
      properties.set(property.id, entry);
    }
    if (section === "property") {
      if (!recordId) return { records: [], notice: "Open one of your assigned properties to review its units." };
      const property = properties.get(recordId);
      if (!property) return { records: [], notice: "This property is not assigned to your landlord profile." };
      return { records: [...property.units].map(([id, unit]) => ({ ...card(id, unit.houseNo, unit.status, { Property: property.name, Tenant: unit.tenant, "Monthly rent": unit.rent, "Lease starts": unit.leaseStart, "Lease ends": unit.leaseEnd }, "Assigned unit"), links: [{ title: "Unit and tenancy details", path: "/dashboard/landlord/unit", recordId: id, emoji: "🚪", description: "Open your authorized unit and active tenancy details." }] })) };
    }
    if (section === "unit") {
      if (!recordId) return { records: [], notice: "Select an assigned unit to review its tenancy." };
      for (const property of properties.values()) {
        const unit = property.units.get(recordId);
        if (unit) return { records: [card(recordId, `${property.name} · ${unit.houseNo}`, unit.status, { Property: property.name, Location: property.location, Address: property.address, Tenant: unit.tenant, "Monthly rent": unit.leaseRent ?? unit.rent, "Lease starts": unit.leaseStart, "Lease ends": unit.leaseEnd }, "Assigned unit and current tenancy")] };
      }
      return { records: [], notice: "This unit is not assigned to your landlord profile." };
    }
    if (section === "statements" || section === "payouts") {
      const rows = await prisma.accountingJournalEntry.findMany({ where: { orgId, status: "POSTED", ...(section === "payouts" ? { sourceType: "OWNER_DISTRIBUTION" } : {}), lines: { some: { landlordId: profile.id } }, ...(q ? { OR: [{ entryNumber: contains }, { description: contains }, { memo: contains }] } : {}) }, ...limit, orderBy: [{ entryDate: "desc" }, { id: "desc" }], select: { id: true, entryNumber: true, entryDate: true, description: true, memo: true, sourceType: true, lines: { where: { landlordId: profile.id }, select: { debit: true, credit: true, propertyId: true } } } });
      const propertyIds = [...new Set(rows.flatMap(row => row.lines.map(line => line.propertyId).filter((id): id is string => Boolean(id))))];
      const propertyNames = propertyIds.length ? await prisma.property.findMany({ where: { orgId, id: { in: propertyIds } }, select: { id: true, name: true } }) : [];
      const names = new Map(propertyNames.map(property => [property.id, property.name]));
      return { records: rows.map(row => card(row.id, `${row.entryNumber} · ${row.memo || row.description}`, row.sourceType, { Date: row.entryDate, Properties: [...new Set(row.lines.map(line => line.propertyId ? names.get(line.propertyId) : null).filter(Boolean))].join(", "), Income: row.lines.reduce((sum, line) => sum + Number(line.credit), 0), Expenses: row.lines.reduce((sum, line) => sum + Number(line.debit), 0) })) };
    }
    const rows = [...properties].filter(([, property]) => !q || `${property.name} ${property.location ?? ""} ${property.address ?? ""}`.toLowerCase().includes(q.toLowerCase())).slice(limit.skip, limit.skip + limit.take);
    return { records: rows.map(([id, property]) => { const units = [...property.units.values()]; const occupied = units.filter(unit => unit.status === "OCCUPIED").length; return { ...card(id, property.name, undefined, { Location: property.location, Address: property.address, Units: units.length, Occupied: occupied, Vacant: units.filter(unit => unit.status === "VACANT").length, "Monthly rent roll": units.reduce((sum, unit) => sum + unit.rent, 0), Tenants: [...new Set(units.map(unit => unit.tenant).filter(Boolean))].length }, "Assigned property portfolio"), links: [{ title: "View assigned units", path: "/dashboard/landlord/property", recordId: id, emoji: "🏘️", description: "Review unit occupancy and current tenancy details." }] }; }) };
  }
return undefined;
}
