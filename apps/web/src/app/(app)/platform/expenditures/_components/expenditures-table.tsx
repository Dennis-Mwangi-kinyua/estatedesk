import {
  DataCard,
  DataCardRow,
  ResponsiveDataList,
} from "@/components/ui/responsive-data-list";
import {
  Badge,
  EmptyRow,
  formatDateTime,
  toneForStatus,
} from "../../_components/control-plane";
import { formatMoney } from "../_lib/helpers";
import type { getPlatformExpendituresPageData } from "../_lib/queries";

type ExpenditureRow = Awaited<
  ReturnType<typeof getPlatformExpendituresPageData>
>["rows"][number];

export function ExpendituresTable({ rows }: { rows: ExpenditureRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        No platform expenditures recorded yet.
      </p>
    );
  }

  return (
    <ResponsiveDataList
      mobile={
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id}>
              <DataCard>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {row.description}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(row.incurredAt)}
                    </p>
                  </div>
                  <Badge tone={toneForStatus(row.status)}>{row.status}</Badge>
                </div>
                <dl className="mt-2.5 space-y-1.5 rounded-xl border border-border bg-muted/20 p-2.5">
                  <DataCardRow label="Payee" value={row.payee ?? "—"} />
                  <DataCardRow label="Category" value={row.category} />
                  <DataCardRow
                    label="Amount"
                    value={formatMoney(Number(row.amount), row.currencyCode)}
                  />
                </dl>
              </DataCard>
            </li>
          ))}
        </ul>
      }
      desktop={
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/80">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                Date
              </th>
              <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                Description
              </th>
              <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                Payee
              </th>
              <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                Category
              </th>
              <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow
                colSpan={6}
                label="No platform expenditures recorded yet."
              />
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-slate-200 align-top dark:border-white/10"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                    {formatDateTime(row.incurredAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-950 dark:text-white">
                    {row.description}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {row.payee ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {row.category}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(row.status)}>{row.status}</Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">
                    {formatMoney(Number(row.amount), row.currencyCode)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      }
    />
  );
}
