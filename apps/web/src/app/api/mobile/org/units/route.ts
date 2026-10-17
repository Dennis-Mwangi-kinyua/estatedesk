import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mobilePortfolioQuerySchema } from "@estatedesk/contracts/mobile";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute } from "@/lib/mobile/route";
import { requireOrgRole } from "@/lib/permissions/guards";

export async function GET(request: Request) {
  return nativeRoute(request, async () => {
    const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
    const { q, status, page } = mobilePortfolioQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const scope = session.membershipScope;
    const where: Prisma.UnitWhereInput = {
      deletedAt: null, property: { orgId: session.activeOrgId!, deletedAt: null },
      ...(scope?.scopeType === "PROPERTY" ? { propertyId: scope.scopeId } : scope?.scopeType === "BUILDING" ? { buildingId: scope.scopeId } : scope?.scopeType === "UNIT" ? { id: scope.scopeId } : {}),
      ...(status === "ALL" ? {} : { status }),
      ...(q ? { OR: [{ houseNo: { contains: q, mode: "insensitive" } }, { property: { name: { contains: q, mode: "insensitive" } } }, { building: { name: { contains: q, mode: "insensitive" } } }] } : {}),
    };
    const total = await prisma.unit.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / 25));
    const currentPage = Math.min(page, totalPages);
    const units = await prisma.unit.findMany({ where, orderBy: [{ propertyId: "asc" }, { houseNo: "asc" }, { id: "asc" }], skip: (currentPage - 1) * 25, take: 25,
      select: { id: true, houseNo: true, type: true, status: true, rentAmount: true, isActive: true, property: { select: { name: true } }, building: { select: { name: true } } } });
    return mobileJson({ total, page: currentPage, totalPages, units: units.map(unit => ({ id: unit.id, houseNo: unit.houseNo, type: unit.type, status: unit.status, isActive: unit.isActive, rentAmount: Number(unit.rentAmount), propertyName: unit.property.name, buildingName: unit.building?.name ?? null })) });
  });
}
