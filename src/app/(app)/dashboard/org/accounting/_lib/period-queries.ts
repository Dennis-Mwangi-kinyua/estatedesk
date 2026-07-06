import { periodCloseSourceId } from "@/lib/accounting/period-close-policy";
import { getPeriodCloseChecklist } from "@/lib/accounting/periods";
import { getAccountingSettings } from "@/lib/accounting/settings";
import { getYearEndClosePreview } from "@/lib/accounting/year-end-close";
import { prisma } from "@/lib/prisma";

export async function getPeriodsPageData(orgId: string) {
  const now = new Date();
  const [org, settings, periods] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true, name: true },
    }),
    getAccountingSettings(prisma, orgId),
    prisma.accountingPeriod.findMany({
      where: { orgId },
      orderBy: { startsAt: "desc" },
      take: 24,
    }),
  ]);

  const currentPeriod =
    periods.find(
      (period) => period.startsAt <= now && period.endsAt >= now,
    ) ?? periods[0] ?? null;

  const checklist = currentPeriod
    ? await getPeriodCloseChecklist(prisma, orgId, currentPeriod.id)
    : null;

  const closingEntryIds = await prisma.accountingJournalEntry.findMany({
    where: {
      orgId,
      sourceType: "ADJUSTMENT",
      sourceId: { startsWith: "period-close:" },
    },
    select: { sourceId: true },
  });
  const closedPeriodIds = new Set(
    closingEntryIds
      .map((entry) => entry.sourceId?.replace("period-close:", ""))
      .filter((id): id is string => Boolean(id)),
  );

  const fiscalYear =
    now.getUTCMonth() + 1 >= settings.fiscalYearStartMonth
      ? now.getUTCFullYear()
      : now.getUTCFullYear() - 1;

  const yearEndPreview = await getYearEndClosePreview(prisma, orgId, fiscalYear);

  return {
    org,
    settings,
    periods,
    currentPeriod,
    checklist,
    closedPeriodIds,
    fiscalYear,
    yearEndPreview,
  };
}

export async function periodHasClosingEntry(orgId: string, periodId: string) {
  const entry = await prisma.accountingJournalEntry.findUnique({
    where: {
      orgId_sourceType_sourceId: {
        orgId,
        sourceType: "ADJUSTMENT",
        sourceId: periodCloseSourceId(periodId),
      },
    },
    select: { id: true },
  });

  return Boolean(entry);
}