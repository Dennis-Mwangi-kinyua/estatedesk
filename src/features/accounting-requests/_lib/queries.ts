import type { AccountingRequestStatus } from "@prisma/client";
import { getCaretakerAllowedUnitIds } from "@/lib/caretaker/access";
import { prisma } from "@/lib/prisma";
import { PENDING_REVIEW_STATUSES } from "./constants";

const requestInclude = {
  submittedBy: { select: { id: true, fullName: true } },
  reviewedBy: { select: { id: true, fullName: true } },
  events: {
    orderBy: { createdAt: "asc" as const },
    include: {
      actor: { select: { fullName: true } },
    },
  },
} as const;

export async function getAccountingRequestsQueue(orgId: string, limit = 20) {
  const [pendingRequests, pendingCount, recentDecisions] = await Promise.all([
    prisma.accountingRequest.findMany({
      where: {
        orgId,
        status: { in: PENDING_REVIEW_STATUSES },
      },
      include: requestInclude,
      orderBy: { createdAt: "asc" },
      take: limit,
    }),
    prisma.accountingRequest.count({
      where: {
        orgId,
        status: { in: PENDING_REVIEW_STATUSES },
      },
    }),
    prisma.accountingRequest.findMany({
      where: {
        orgId,
        status: { in: ["APPROVED", "REJECTED", "PAID"] },
      },
      include: requestInclude,
      orderBy: { reviewedAt: "desc" },
      take: 8,
    }),
  ]);

  const propertyIds = [
    ...new Set(
      [...pendingRequests, ...recentDecisions]
        .map((request) => request.propertyId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const properties = propertyIds.length
    ? await prisma.property.findMany({
        where: { id: { in: propertyIds }, orgId },
        select: { id: true, name: true },
      })
    : [];

  const propertyNames = new Map(properties.map((property) => [property.id, property.name]));
  const expenseAccounts = await getExpenseAccounts(orgId);

  return {
    pendingRequests,
    pendingCount,
    recentDecisions,
    propertyNames,
    expenseAccounts,
  };
}

async function getExpenseAccounts(orgId: string) {
  return prisma.accountingAccount.findMany({
    where: { orgId, isActive: true, type: "EXPENSE" },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, systemKey: true },
  });
}

export async function getFinanceRequestsPageData(input: {
  orgId: string;
  userId: string;
  workspace: "caretaker" | "org";
  membershipScope?: Parameters<typeof getCaretakerAllowedUnitIds>[0]["membershipScope"];
  focusId?: string;
}) {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: input.orgId },
    select: { currencyCode: true, name: true },
  });

  const requests = await prisma.accountingRequest.findMany({
    where: {
      orgId: input.orgId,
      submittedByUserId: input.userId,
    },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  let properties: { id: string; name: string }[] = [];

  if (input.workspace === "caretaker") {
    const allowedUnitIds = await getCaretakerAllowedUnitIds({
      orgId: input.orgId,
      caretakerUserId: input.userId,
      membershipScope: input.membershipScope,
    });

    if (allowedUnitIds.length > 0) {
      const units = await prisma.unit.findMany({
        where: { id: { in: allowedUnitIds } },
        select: { propertyId: true },
      });
      const propertyIds = [...new Set(units.map((unit) => unit.propertyId))];
      properties = await prisma.property.findMany({
        where: {
          id: { in: propertyIds },
          orgId: input.orgId,
          deletedAt: null,
          isActive: true,
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
    }
  } else {
    properties = await prisma.property.findMany({
      where: { orgId: input.orgId, deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  const focusedRequest =
    input.focusId &&
    requests.find((request) => request.id === input.focusId);

  return {
    org,
    requests,
    properties,
    focusedRequest: focusedRequest ?? null,
    defaultDate: new Date().toISOString().slice(0, 10),
  };
}

export async function getAccountingRequestsReviewPageData(
  orgId: string,
  status?: AccountingRequestStatus,
) {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { currencyCode: true, name: true },
  });

  const requests = await prisma.accountingRequest.findMany({
    where: {
      orgId,
      ...(status ? { status } : {}),
    },
    include: requestInclude,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 60,
  });

  const propertyIds = [
    ...new Set(
      requests
        .map((request) => request.propertyId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const properties = propertyIds.length
    ? await prisma.property.findMany({
        where: { id: { in: propertyIds }, orgId },
        select: { id: true, name: true },
      })
    : [];

  const propertyNames = new Map(properties.map((property) => [property.id, property.name]));

  const statusCounts = await prisma.accountingRequest.groupBy({
    by: ["status"],
    where: { orgId },
    _count: { _all: true },
  });

  const expenseAccounts = await getExpenseAccounts(orgId);

  return {
    org,
    requests,
    propertyNames,
    expenseAccounts,
    statusCounts: Object.fromEntries(
      statusCounts.map((row) => [row.status, row._count._all]),
    ) as Partial<Record<AccountingRequestStatus, number>>,
  };
}