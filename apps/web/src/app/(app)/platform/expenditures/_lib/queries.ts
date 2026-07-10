import { prisma } from "@/lib/prisma";

export async function getPlatformExpendituresPageData() {
  const rows = await prisma.expenditure.findMany({
    where: { scope: "PLATFORM" },
    orderBy: { incurredAt: "desc" },
    take: 200,
  });

  const totals = new Map<string, number>();

  for (const row of rows) {
    if (row.status === "VOIDED") continue;

    totals.set(
      row.currencyCode,
      (totals.get(row.currencyCode) ?? 0) + Number(row.amount),
    );
  }

  return {
    rows,
    totals: [...totals.entries()].map(([currencyCode, amount]) => ({
      currencyCode,
      amount,
    })),
  };
}