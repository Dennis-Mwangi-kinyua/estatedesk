import Link from "next/link";
import { FileSpreadsheet, HandCoins } from "lucide-react";
import { emailOwnerStatementAction, postOwnerDistributionAction } from "../distribution-actions";
import type { getDistributionsPageData } from "../_lib/distribution-queries";
import type { getOwnerStatementPageData } from "../_lib/owner-statement-queries";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  formatDate,
  formatMoney,
  labelClassName,
} from "../_lib/helpers";
import { panelShellClassName, SectionHeader, StatCard } from "./accounting-ui";

type DistributionsPageData = Awaited<ReturnType<typeof getDistributionsPageData>>;
type OwnerStatementPageData = Awaited<ReturnType<typeof getOwnerStatementPageData>>;

function buildStatementQuery(filters: OwnerStatementPageData["filters"]) {
  const params = new URLSearchParams();
  if (filters.landlordId) params.set("landlordId", filters.landlordId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return params;
}

function buildExportHref(filters: OwnerStatementPageData["filters"]) {
  return `/dashboard/org/accounting/distributions/export?${buildStatementQuery(filters).toString()}`;
}

function buildPdfHref(filters: OwnerStatementPageData["filters"]) {
  return `/dashboard/org/accounting/distributions/pdf?${buildStatementQuery(filters).toString()}`;
}

function buildPrintHref(filters: OwnerStatementPageData["filters"]) {
  return `/print/owner-statements?${buildStatementQuery(filters).toString()}`;
}

export function AccountingDistributionsWorkspace({
  data,
  statementData,
  message,
}: {
  data: DistributionsPageData;
  statementData: OwnerStatementPageData;
  message?: string;
}) {
  const { org, landlords, properties, distributions, ownerPayableBalance, defaultDate } =
    data;
  const { statement, filters } = statementData;

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Owner funds payable"
          value={formatMoney(ownerPayableBalance, org.currencyCode)}
          Icon={HandCoins}
          highlight
        />
        <StatCard label="Landlords" value={String(landlords.length)} compact />
      </section>

      <section className={panelShellClassName}>
        <SectionHeader
          icon={FileSpreadsheet}
          title="Multi-property owner statements"
          description="Income, expenses, and distributions broken down by property for each landlord."
          action={
            filters.landlordId ? (
              <div className="flex flex-wrap gap-2">
                <a href={buildPdfHref(filters)} className={buttonSecondaryClassName}>
                  Download PDF
                </a>
                <a href={buildPrintHref(filters)} target="_blank" rel="noreferrer" className={buttonSecondaryClassName}>
                  Print
                </a>
                <a href={buildExportHref(filters)} className={buttonSecondaryClassName}>
                  Export CSV
                </a>
              </div>
            ) : null
          }
        />

        <form method="get" className="grid gap-4 border-b border-border px-5 py-4 sm:grid-cols-4 sm:px-6">
          <label className={labelClassName}>
            Landlord
            <select name="landlordId" defaultValue={filters.landlordId} className={fieldClassName}>
              {statementData.landlords.map((landlord) => (
                <option key={landlord.id} value={landlord.id}>
                  {landlord.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClassName}>
            From
            <input name="from" type="date" defaultValue={filters.from} className={fieldClassName} />
          </label>
          <label className={labelClassName}>
            To
            <input name="to" type="date" defaultValue={filters.to} className={fieldClassName} />
          </label>
          <div className="flex items-end">
            <button type="submit" className={buttonSecondaryClassName}>
              Apply
            </button>
          </div>
        </form>

        {statement ? (
          <div className="px-5 py-5 sm:px-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {statement.landlord.displayName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatDate(statement.from)} – {formatDate(statement.to)} ·{" "}
                  {statement.assignedPropertyCount} assigned propert
                  {statement.assignedPropertyCount === 1 ? "y" : "ies"}
                </p>
                {statement.landlord.email ? (
                  <p className="mt-1 text-xs text-muted-foreground">{statement.landlord.email}</p>
                ) : (
                  <p className="mt-1 text-xs text-amber-700">
                    No email on file — add one on the landlord profile to enable delivery.
                  </p>
                )}
              </div>
              {statement.landlord.email ? (
                <form action={emailOwnerStatementAction}>
                  <input type="hidden" name="landlordId" value={filters.landlordId} />
                  <input type="hidden" name="from" value={filters.from} />
                  <input type="hidden" name="to" value={filters.to} />
                  <button type="submit" className={buttonPrimaryClassName}>
                    Email statement
                  </button>
                </form>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-2 py-2">Property</th>
                    <th className="px-2 py-2">Income</th>
                    <th className="px-2 py-2">Expenses</th>
                    <th className="px-2 py-2">Distributions</th>
                    <th className="px-2 py-2">Net to owner</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.properties.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-2 py-6 text-muted-foreground">
                        No posted GL activity for this landlord in the selected period.
                      </td>
                    </tr>
                  ) : (
                    statement.properties.map((row) => (
                      <tr key={row.propertyId ?? "unassigned"} className="border-b border-border/60">
                        <td className="px-2 py-2">{row.propertyName}</td>
                        <td className="px-2 py-2">
                          {formatMoney(row.income, org.currencyCode)}
                        </td>
                        <td className="px-2 py-2">
                          {formatMoney(row.expenses, org.currencyCode)}
                        </td>
                        <td className="px-2 py-2">
                          {formatMoney(row.distributions, org.currencyCode)}
                        </td>
                        <td className="px-2 py-2 font-medium text-foreground">
                          {formatMoney(row.netToOwner, org.currencyCode)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {statement.properties.length > 0 ? (
                  <tfoot>
                    <tr className="border-t border-border font-semibold text-foreground">
                      <td className="px-2 py-2">Total</td>
                      <td className="px-2 py-2">
                        {formatMoney(statement.totals.income, org.currencyCode)}
                      </td>
                      <td className="px-2 py-2">
                        {formatMoney(statement.totals.expenses, org.currencyCode)}
                      </td>
                      <td className="px-2 py-2">
                        {formatMoney(statement.totals.distributions, org.currencyCode)}
                      </td>
                      <td className="px-2 py-2">
                        {formatMoney(statement.totals.netToOwner, org.currencyCode)}
                      </td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
            Add landlord profiles to generate owner statements.
          </p>
        )}
      </section>

      <section className={panelShellClassName}>
        <SectionHeader
          icon={HandCoins}
          title="Owner distribution"
          description="Pay landlords from owner funds payable. Posts DR owner payable, CR bank or cash."
        />

        {landlords.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
            No active landlords found. Add landlord profiles on properties first.
          </p>
        ) : (
          <form action={postOwnerDistributionAction} className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
            <label className={labelClassName}>
              Landlord
              <select name="landlordId" required className={fieldClassName}>
                {landlords.map((landlord) => (
                  <option key={landlord.id} value={landlord.id}>
                    {landlord.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Property (optional)
              <select name="propertyId" className={fieldClassName}>
                <option value="">All / unspecified</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Amount
              <input name="amount" type="number" min="0.01" step="0.01" required className={fieldClassName} />
            </label>
            <label className={labelClassName}>
              Payment method
              <select name="paymentMethod" className={fieldClassName}>
                <option value="BANK">Bank transfer</option>
                <option value="MPESA">M-Pesa</option>
                <option value="CASH">Cash</option>
              </select>
            </label>
            <label className={labelClassName}>
              Date
              <input name="entryDate" type="date" required defaultValue={defaultDate} className={fieldClassName} />
            </label>
            <label className={labelClassName}>
              Description
              <input
                name="description"
                required
                defaultValue="Owner distribution"
                className={fieldClassName}
              />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className={buttonPrimaryClassName}>
                Post distribution
              </button>
            </div>
          </form>
        )}
      </section>

      <section className={panelShellClassName}>
        <SectionHeader
          title="Recent distributions"
          description="Posted owner distribution journals."
          action={
            <Link
              href="/dashboard/org/accounting/journals?sourceType=OWNER_DISTRIBUTION"
              className="text-sm font-semibold text-primary"
            >
              Open register
            </Link>
          }
        />
        <div className="divide-y divide-border">
          {distributions.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
              No owner distributions posted yet.
            </p>
          ) : (
            distributions.map((journal) => {
              const creditLine = journal.lines.find((line) => Number(line.credit) > 0);
              return (
                <div key={journal.id} className="px-5 py-4 sm:px-6">
                  <p className="text-sm font-semibold text-foreground">{journal.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {journal.entryNumber} · {formatDate(journal.entryDate)} ·{" "}
                    {creditLine
                      ? formatMoney(Number(creditLine.credit), org.currencyCode)
                      : "—"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}