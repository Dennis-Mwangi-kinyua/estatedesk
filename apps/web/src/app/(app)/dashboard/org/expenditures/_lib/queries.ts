import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "./types";

export async function loadOrgExpendituresPageData(orgId: string, page = 1) {
  const expenditureWhere = { orgId };

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
      where: { orgId, deletedAt: null },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.property.findMany({
      where: { orgId, deletedAt: null },
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