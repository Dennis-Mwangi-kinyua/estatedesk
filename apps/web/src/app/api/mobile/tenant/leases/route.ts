import { prisma } from "@/lib/prisma";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    const leases = await prisma.lease.findMany({
      where: { orgId: session.activeOrgId!, deletedAt: null, tenant: { userId: session.userId, deletedAt: null } },
      orderBy: [{ startDate: "desc" }, { id: "desc" }], take: 100,
      select: { id: true, status: true, startDate: true, endDate: true, monthlyRent: true, deposit: true, dueDay: true,
        unit: { select: { houseNo: true, building: { select: { name: true } }, property: { select: { name: true } } } } },
    });
    return mobileJson(leases.map(lease => ({
      id: lease.id, propertyName: lease.unit.property.name, unitLabel: lease.unit.houseNo, buildingName: lease.unit.building?.name ?? null,
      status: lease.status, startDate: lease.startDate.toISOString(), endDate: lease.endDate?.toISOString() ?? null,
      monthlyRent: Number(lease.monthlyRent), deposit: lease.deposit == null ? null : Number(lease.deposit), dueDay: lease.dueDay,
    })));
  }, { role: "TENANT" });
}
