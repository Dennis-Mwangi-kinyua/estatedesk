import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { getOwnerStatement } from "@/lib/accounting/owner-statements";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function LandlordPayoutsPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) redirect("/login");
  if (session.activeOrgRole !== "LANDLORD") redirect("/dashboard");

  const orgId = session.activeOrgId;
  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const [org, profile] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, currencyCode: true },
    }),
    prisma.landlordProfile.findFirst({
      where: {
        orgId,
        userId: session.userId,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true, displayName: true },
    }),
  ]);

  if (!profile || !org) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <h1 className="text-xl font-semibold">Payouts</h1>
        <p className="text-sm text-muted-foreground">
          No active landlord profile is linked to your account.
        </p>
      </div>
    );
  }

  const [ytd, recentDistributions] = await Promise.all([
    getOwnerStatement(prisma, orgId, profile.id, yearStart, now).catch(
      () => null,
    ),
    prisma.accountingJournalEntry.findMany({
      where: {
        orgId,
        status: "POSTED",
        sourceType: "OWNER_DISTRIBUTION",
        entryDate: { gte: yearStart, lte: now },
        lines: { some: { landlordId: profile.id } },
      },
      orderBy: { entryDate: "desc" },
      take: 40,
      select: {
        id: true,
        entryDate: true,
        memo: true,
        description: true,
        entryNumber: true,
        lines: {
          where: { landlordId: profile.id, credit: { gt: 0 } },
          select: {
            credit: true,
            propertyId: true,
          },
        },
      },
    }),
  ]);

  const propertyIds = [
    ...new Set(
      recentDistributions.flatMap((journal) =>
        journal.lines
          .map((line) => line.propertyId)
          .filter((id): id is string => Boolean(id)),
      ),
    ),
  ];

  const properties =
    propertyIds.length > 0
      ? await prisma.property.findMany({
          where: { id: { in: propertyIds }, orgId },
          select: { id: true, name: true },
        })
      : [];
  const propertyNameById = new Map(properties.map((p) => [p.id, p.name]));

  const currency = org.currencyCode || "KES";
  const payoutRows = recentDistributions.map((journal) => {
    const amount = journal.lines.reduce(
      (sum, line) => sum + Number(line.credit),
      0,
    );
    const propertyNames = [
      ...new Set(
        journal.lines
          .map((line) =>
            line.propertyId
              ? propertyNameById.get(line.propertyId) ?? null
              : null,
          )
          .filter((name): name is string => Boolean(name)),
      ),
    ];

    return {
      id: journal.id,
      entryDate: journal.entryDate,
      memo: journal.memo ?? journal.description,
      reference: journal.entryNumber,
      amount,
      propertyNames,
    };
  });

  const totalYtd = ytd?.totals.distributions ?? 0;
  const netYtd = ytd?.totals.netToOwner ?? 0;

  return (
    <div className="ed-mobile-first mx-auto w-full max-w-5xl space-y-4 p-3 sm:space-y-5 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Landlord
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Payouts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Owner distributions recorded for {profile.displayName} ·{" "}
            {org.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/landlord"
            className="inline-flex min-h-10 items-center rounded-xl border border-border px-3 text-sm font-semibold"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/landlord/statements"
            className="inline-flex min-h-10 items-center rounded-xl border border-border px-3 text-sm font-semibold"
          >
            Statements
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Paid out YTD
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatMoney(totalYtd, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Net to owner YTD
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatMoney(netYtd, currency)}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl border border-border bg-card p-3 shadow-sm sm:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Distribution entries
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {payoutRows.length}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-3 py-3 sm:px-4">
          <h2 className="text-sm font-semibold">Recent distributions</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Posted OWNER_DISTRIBUTION journals credited to your landlord profile
            this year.
          </p>
        </div>

        {payoutRows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No payouts recorded yet. When the organization posts owner
            distributions, they appear here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {payoutRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-1.5 px-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {formatDateTime(row.entryDate)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {row.memo || row.reference || "Owner distribution"}
                    {row.propertyNames.length
                      ? ` · ${row.propertyNames.join(", ")}`
                      : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {formatMoney(row.amount, currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
