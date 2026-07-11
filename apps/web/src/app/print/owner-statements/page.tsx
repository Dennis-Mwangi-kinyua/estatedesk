import { notFound } from "next/navigation";
import { requireOrgRole } from "@/lib/permissions/guards";
import { getOwnerStatement } from "@/lib/accounting/owner-statements";
import { prisma } from "@/lib/prisma";
import { OwnerStatementPrintControls } from "./owner-statement-print-controls";

export const dynamic = "force-dynamic";

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export default async function OwnerStatementPrintPage({
  searchParams,
}: {
  searchParams?: Promise<{
    landlordId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await requireOrgRole([
    "ADMIN",
    "MANAGER",
    "ACCOUNTANT",
    "LANDLORD",
  ]);
  const orgId = session.activeOrgId!;
  const resolved = (await searchParams) ?? {};
  const landlordId = resolved.landlordId;

  if (!landlordId) {
    notFound();
  }

  // Landlords may only print their own statement.
  if (session.activeOrgRole === "LANDLORD") {
    const ownProfile = await prisma.landlordProfile.findFirst({
      where: {
        id: landlordId,
        orgId,
        userId: session.userId,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });
    if (!ownProfile) {
      notFound();
    }
  }

  const now = new Date();
  const from = resolved.from ? new Date(resolved.from) : new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const to = resolved.to ? new Date(resolved.to) : now;

  const [org, statement] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { name: true, address: true, currencyCode: true },
    }),
    getOwnerStatement(prisma, orgId, landlordId, from, to),
  ]);

  return (
    <main className="min-h-screen bg-white text-neutral-900 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="no-print border-b bg-neutral-50 px-4 py-3">
        <OwnerStatementPrintControls />
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 print:px-0 print:py-0">
        <header className="border-b border-neutral-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            EstateDesk Owner Statement
          </p>
          <h1 className="mt-2 text-3xl font-bold">{org.name}</h1>
          {org.address ? <p className="mt-1 text-sm text-neutral-600">{org.address}</p> : null}
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Prepared for
            </p>
            <p className="mt-1 text-lg font-semibold">{statement.landlord.displayName}</p>
            {statement.landlord.email ? (
              <p className="text-sm text-neutral-600">{statement.landlord.email}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Period
            </p>
            <p className="mt-1 text-sm">
              {formatDate(statement.from)} – {formatDate(statement.to)}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Net to owner
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {formatMoney(statement.totals.netToOwner, org.currencyCode)}
            </p>
          </div>
        </section>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-[0.14em] text-neutral-500">
              <th className="py-2 pr-3">Property</th>
              <th className="py-2 pr-3 text-right">Income</th>
              <th className="py-2 pr-3 text-right">Expenses</th>
              <th className="py-2 pr-3 text-right">Distributions</th>
              <th className="py-2 text-right">Net to owner</th>
            </tr>
          </thead>
          <tbody>
            {statement.properties.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-neutral-500">
                  No posted GL activity for this period.
                </td>
              </tr>
            ) : (
              statement.properties.map((row) => (
                <tr key={row.propertyId ?? "unassigned"} className="border-b border-neutral-100">
                  <td className="py-3 pr-3 font-medium">{row.propertyName}</td>
                  <td className="py-3 pr-3 text-right">
                    {formatMoney(row.income, org.currencyCode)}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {formatMoney(row.expenses, org.currencyCode)}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {formatMoney(row.distributions, org.currencyCode)}
                  </td>
                  <td className="py-3 text-right font-semibold">
                    {formatMoney(row.netToOwner, org.currencyCode)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {statement.properties.length > 0 ? (
            <tfoot>
              <tr className="border-t border-neutral-300 font-semibold">
                <td className="py-3 pr-3">Total</td>
                <td className="py-3 pr-3 text-right">
                  {formatMoney(statement.totals.income, org.currencyCode)}
                </td>
                <td className="py-3 pr-3 text-right">
                  {formatMoney(statement.totals.expenses, org.currencyCode)}
                </td>
                <td className="py-3 pr-3 text-right">
                  {formatMoney(statement.totals.distributions, org.currencyCode)}
                </td>
                <td className="py-3 text-right">
                  {formatMoney(statement.totals.netToOwner, org.currencyCode)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>

        <p className="mt-10 text-xs text-neutral-500">
          Generated {formatDate(new Date())}. This statement summarizes posted income, expenses,
          and distributions by property.
        </p>
      </div>
    </main>
  );
}