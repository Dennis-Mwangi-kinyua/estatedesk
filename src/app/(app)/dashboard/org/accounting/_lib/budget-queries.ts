import { getBudgetVariance } from "@/lib/accounting/budgets";
import { prisma } from "@/lib/prisma";

export async function getBudgetsPageData(orgId: string, budgetId?: string) {
  const [org, periods, budgets, accounts] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true, name: true },
    }),
    prisma.accountingPeriod.findMany({
      where: { orgId },
      orderBy: { startsAt: "desc" },
      take: 24,
    }),
    prisma.accountingBudget.findMany({
      where: { orgId },
      include: {
        period: { select: { id: true, name: true, startsAt: true, endsAt: true } },
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.accountingAccount.findMany({
      where: { orgId, isActive: true, type: { in: ["INCOME", "EXPENSE"] } },
      orderBy: { code: "asc" },
    }),
  ]);

  const selectedId = budgetId ?? budgets[0]?.id ?? null;
  const variance = selectedId ? await getBudgetVariance(prisma, orgId, selectedId) : [];

  return {
    org,
    periods,
    budgets,
    accounts,
    selectedId,
    variance,
  };
}