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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function LandlordStatementsPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireUserSession();

  if (!session.activeOrgId) redirect("/login");
  if (session.activeOrgRole !== "LANDLORD") redirect("/dashboard");

  const orgId = session.activeOrgId;
  const params = (await searchParams) ?? {};
  const now = new Date();
  const from = params.from
    ? new Date(params.from)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = params.to ? new Date(params.to) : now;

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
        <h1 className="text-xl font-semibold">Owner statements</h1>
        <p className="text-sm text-muted-foreground">
          No active landlord profile is linked to your account.
        </p>
        <Link
          href="/dashboard/landlord"
          className="text-sm font-semibold underline"
        >
          Back to overview
        </Link>
      </div>
    );
  }

  let statement: Awaited<ReturnType<typeof getOwnerStatement>> | null = null;
  let loadError: string | null = null;

  try {
    statement = await getOwnerStatement(prisma, orgId, profile.id, from, to);
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Could not load owner statement.";
  }

  const currency = org.currencyCode || "KES";
  const fromValue = from.toISOString().slice(0, 10);
  const toValue = to.toISOString().slice(0, 10);

  return (
    <div className="ed-mobile-first mx-auto w-full max-w-5xl space-y-4 p-3 sm:space-y-5 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Landlord
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Owner statements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Income, expenses, and distributions for {profile.displayName}
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
            href="/dashboard/landlord/payouts"
            className="inline-flex min-h-10 items-center rounded-xl border border-border px-3 text-sm font-semibold"
          >
            Payouts
          </Link>
          <Link
            href={`/print/owner-statements?landlordId=${profile.id}&from=${fromValue}&to=${toValue}`}
            className="inline-flex min-h-10 items-center rounded-xl bg-foreground px-3 text-sm font-semibold text-background"
          >
            Print / PDF
          </Link>
        </div>
      </div>

      <form className="grid gap-2 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-4">
        <div>
          <label htmlFor="from" className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={fromValue}
            className="mt-1 min-h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="to" className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={toValue}
            className="mt-1 min-h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="min-h-10 rounded-xl bg-foreground px-4 text-sm font-semibold text-background"
        >
          Apply period
        </button>
      </form>

      {loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          {loadError}
        </div>
      ) : null}

      {statement ? (
        <>
          <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: "Income", value: statement.totals.income },
              { label: "Expenses", value: statement.totals.expenses },
              { label: "Distributions", value: statement.totals.distributions },
              { label: "Net to owner", value: statement.totals.netToOwner },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-card p-3 shadow-sm"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatMoney(item.value, currency)}
                </p>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-3 py-3 sm:px-4">
              <h2 className="text-sm font-semibold">
                By property · {formatDate(from)} – {formatDate(to)}
              </h2>
            </div>

            {statement.properties.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No posted accounting lines for this period yet.
              </p>
            ) : (
              <ul className="divide-y divide-border lg:hidden">
                {statement.properties.map((row) => (
                  <li key={row.propertyId ?? row.propertyName} className="px-3 py-3.5">
                    <p className="font-semibold">{row.propertyName}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                      <div>
                        Income:{" "}
                        <span className="font-semibold text-foreground">
                          {formatMoney(row.income, currency)}
                        </span>
                      </div>
                      <div>
                        Expenses:{" "}
                        <span className="font-semibold text-foreground">
                          {formatMoney(row.expenses, currency)}
                        </span>
                      </div>
                      <div>
                        Paid out:{" "}
                        <span className="font-semibold text-foreground">
                          {formatMoney(row.distributions, currency)}
                        </span>
                      </div>
                      <div>
                        Net:{" "}
                        <span className="font-semibold text-foreground">
                          {formatMoney(row.netToOwner, currency)}
                        </span>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}

            {statement.properties.length > 0 ? (
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Property</th>
                      <th className="px-4 py-3 font-medium">Income</th>
                      <th className="px-4 py-3 font-medium">Expenses</th>
                      <th className="px-4 py-3 font-medium">Distributions</th>
                      <th className="px-4 py-3 font-medium">Net to owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.properties.map((row) => (
                      <tr
                        key={row.propertyId ?? row.propertyName}
                        className="border-t border-border"
                      >
                        <td className="px-4 py-3 font-medium">
                          {row.propertyName}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatMoney(row.income, currency)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatMoney(row.expenses, currency)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatMoney(row.distributions, currency)}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          {formatMoney(row.netToOwner, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
