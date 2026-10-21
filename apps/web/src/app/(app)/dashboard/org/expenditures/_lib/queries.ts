import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "./types";
import { scopedPropertyWhere, scopedUnitWhere, canViewWholeProperty, type RecordScope } from "@/lib/permissions/record-scope";

export async function loadOrgExpendituresPageData(orgId: string, page = 1, scope?: RecordScope) {
  const unitWhere = scopedUnitWhere(orgId, scope);
  const [visibleProperties, visibleUnits] = await Promise.all([
    canViewWholeProperty(scope) ? prisma.property.findMany({ where: scopedPropertyWhere(orgId, scope), select: { id: true } }) : Promise.resolve([]),
    prisma.unit.findMany({ where: unitWhere, select: { id: true } }),
  ]);
  const propertyIds = visibleProperties.map(({ id }) => id);
  const unitIds = visibleUnits.map(({ id }) => id);
  const expenditureWhere = scope?.scopeType === "ORG"
    ? { orgId }
    : { orgId, OR: [
        ...(propertyIds.length ? [{ propertyId: { in: propertyIds } }] : []),
        ...(unitIds.length ? [{ unitId: { in: unitIds } }] : []),
        { tenant: { leases: { some: { deletedAt: null, unit: unitWhere } } } },
      ] };

  const { page: currentPage, skip, take } = getPagination({
    page,
    pageSize: PAGE_SIZE,
  });

  const [
    org,
    tenants,
    properties,
    totalExpenditures,
    organizationScopeCount,
    tenantScopeCount,
    pendingApprovalCount,
    approvedAwaitingPaymentCount,
    recordedTotalAggregate,
    expenditures,
  ] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true, name: true },
    }),
    prisma.tenant.findMany({
      where: { orgId, deletedAt: null, leases: { some: { deletedAt: null, unit: unitWhere } } },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.property.findMany({
      where: scopedPropertyWhere(orgId, scope),
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.expenditure.count({ where: expenditureWhere }),
    prisma.expenditure.count({
      where: { ...expenditureWhere, scope: "ORGANIZATION" },
    }),
    prisma.expenditure.count({
      where: { ...expenditureWhere, scope: "TENANT" },
    }),
    prisma.expenditure.count({
      where: { ...expenditureWhere, status: "PENDING_APPROVAL" },
    }),
    prisma.expenditure.count({
      where: { ...expenditureWhere, status: "APPROVED" },
    }),
    prisma.expenditure.aggregate({
      where: {
        ...expenditureWhere,
        status: { not: "VOIDED" },
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.expenditure.findMany({
      where: expenditureWhere,
      include: { tenant: { select: { fullName: true } } },
      orderBy: { incurredAt: "desc" },
      skip,
      take,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalExpenditures / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const showingFrom = totalExpenditures === 0 ? 0 : skip + 1;
  const showingTo = Math.min(skip + expenditures.length, totalExpenditures);

  return {
    org,
    tenants,
    properties,
    expenditures,
    totalExpenditures,
    organizationScopeCount,
    tenantScopeCount,
    pendingApprovalCount,
    approvedAwaitingPaymentCount,
    recordedTotal: Number(recordedTotalAggregate._sum.amount ?? 0),
    currentPage: safePage,
    totalPages,
    showingFrom,
    showingTo,
  };
}
