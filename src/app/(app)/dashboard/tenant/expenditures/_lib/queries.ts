import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "./types";

export async function loadTenantExpendituresPageData(args: {
  orgId: string;
  userId: string;
  page?: number;
}) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      orgId: args.orgId,
      userId: args.userId,
      deletedAt: null,
    },
    include: {
      org: {
        select: {
          currencyCode: true,
        },
      },
    },
  });

  if (!tenant) {
    return null;
  }

  const where = {
    orgId: tenant.orgId,
    tenantId: tenant.id,
  };

  const { page: currentPage, skip, take } = getPagination({
    page: args.page,
    pageSize: PAGE_SIZE,
  });

  const [totalExpenditures, expenditures] = await Promise.all([
    prisma.expenditure.count({ where }),
    prisma.expenditure.findMany({
      where,
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
    tenant,
    expenditures,
    totalExpenditures,
    currentPage: safePage,
    totalPages,
    showingFrom,
    showingTo,
  };
}