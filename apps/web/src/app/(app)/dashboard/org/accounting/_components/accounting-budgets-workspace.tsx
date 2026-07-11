import Link from "next/link";
import { PieChart } from "lucide-react";
import {
  DataCard,
  DataCardRow,
  ResponsiveDataList,
} from "@/components/ui/responsive-data-list";
import {
  approveBudgetAction,
  createBudgetAction,
  upsertBudgetLineAction,
} from "../budget-actions";
import type { getBudgetsPageData } from "../_lib/budget-queries";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  formatMoney,
  labelClassName,
} from "../_lib/helpers";
import { panelShellClassName, SectionHeader } from "./accounting-ui";

type BudgetsPageData = Awaited<ReturnType<typeof getBudgetsPageData>>;

export function AccountingBudgetsWorkspace({
  data,
  message,
}: {
  data: BudgetsPageData;
  message?: string;
}) {
  const { org, periods, budgets, accounts, selectedId, variance } = data;
  const selected = budgets.find((budget) => budget.id === selectedId) ?? budgets[0] ?? null;

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      <section className={panelShellClassName}>
        <SectionHeader
          icon={PieChart}
          title="Budgets"
          description="Plan income and expense by period, then track variance against actual GL activity."
        />

        <form action={createBudgetAction} className="grid gap-4 border-b border-border px-5 py-4 sm:grid-cols-3 sm:px-6">
          <label className={labelClassName}>
            Period
            <select name="periodId" required className={fieldClassName}>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClassName}>
            Budget name
            <input name="name" required placeholder="FY 2026 operating budget" className={fieldClassName} />
          </label>
          <div className="flex items-end">
            <button type="submit" className={buttonPrimaryClassName}>
              Create budget
            </button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3 sm:px-6">
          {budgets.map((budget) => (
            <Link
              key={budget.id}
              href={`/dashboard/org/accounting/budgets?budgetId=${budget.id}`}
              className={
                budget.id === selected?.id
                  ? "inline-flex h-9 items-center rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground"
                  : "inline-flex h-9 items-center rounded-xl border border-border bg-background px-3.5 text-xs font-semibold text-foreground transition hover:bg-muted/30"
              }
            >
              {budget.name} · {budget.status}
            </Link>
          ))}
        </div>

        {selected ? (
          <div className="px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{selected.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selected.period.name} · {selected.status}
                </p>
              </div>
              {selected.status === "DRAFT" ? (
                <form action={approveBudgetAction}>
                  <input type="hidden" name="budgetId" value={selected.id} />
                  <button type="submit" className={buttonSecondaryClassName}>
                    Approve budget
                  </button>
                </form>
              ) : null}
            </div>

            {selected.status === "DRAFT" ? (
              <form
                action={upsertBudgetLineAction}
                className="mt-4 grid gap-4 rounded-2xl border border-border bg-muted/10 p-4 sm:grid-cols-3"
              >
                <input type="hidden" name="budgetId" value={selected.id} />
                <label className={labelClassName}>
                  Account
                  <select name="accountId" required className={fieldClassName}>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} · {account.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClassName}>
                  Amount
                  <input name="amount" type="number" min="0" step="0.01" required className={fieldClassName} />
                </label>
                <div className="flex items-end">
                  <button type="submit" className={buttonSecondaryClassName}>
                    Add line
                  </button>
                </div>
              </form>
            ) : null}

            <div className="mt-5">
              {variance.length === 0 ? (
                <p className="px-2 py-6 text-sm text-muted-foreground">
                  Add budget lines to see variance.
                </p>
              ) : (
                <ResponsiveDataList
                  mobile={
                    <ul className="divide-y divide-border rounded-xl border border-border">
                      {variance.map((row) => (
                        <li key={row.accountId}>
                          <DataCard>
                            <p className="text-sm font-semibold">
                              {row.code} · {row.name}
                            </p>
                            <dl className="mt-2 space-y-1.5 rounded-xl border border-border bg-muted/20 p-2.5">
                              <DataCardRow
                                label="Budgeted"
                                value={formatMoney(row.budgeted, org.currencyCode)}
                              />
                              <DataCardRow
                                label="Actual"
                                value={formatMoney(row.actual, org.currencyCode)}
                              />
                              <DataCardRow
                                label="Variance"
                                value={`${formatMoney(row.variance, org.currencyCode)}${
                                  row.variancePct !== null
                                    ? ` (${row.variancePct.toFixed(1)}%)`
                                    : ""
                                }`}
                              />
                            </dl>
                          </DataCard>
                        </li>
                      ))}
                    </ul>
                  }
                  desktop={
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          <th className="px-2 py-2">Account</th>
                          <th className="px-2 py-2">Budgeted</th>
                          <th className="px-2 py-2">Actual</th>
                          <th className="px-2 py-2">Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variance.map((row) => (
                          <tr
                            key={row.accountId}
                            className="border-b border-border/60"
                          >
                            <td className="px-2 py-2">
                              {row.code} · {row.name}
                            </td>
                            <td className="px-2 py-2">
                              {formatMoney(row.budgeted, org.currencyCode)}
                            </td>
                            <td className="px-2 py-2">
                              {formatMoney(row.actual, org.currencyCode)}
                            </td>
                            <td
                              className={`px-2 py-2 font-medium ${
                                row.variance > 0
                                  ? "text-amber-700"
                                  : "text-emerald-700"
                              }`}
                            >
                              {formatMoney(row.variance, org.currencyCode)}
                              {row.variancePct !== null
                                ? ` (${row.variancePct.toFixed(1)}%)`
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  }
                />
              )}
            </div>
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
            Create a budget for an accounting period to start planning.
          </p>
        )}
      </section>
    </div>
  );
}