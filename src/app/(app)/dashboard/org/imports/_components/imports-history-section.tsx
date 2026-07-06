import { Clock3, FileSpreadsheet } from "lucide-react";
import type { ImportHistoryItem } from "../_lib/types";

const kindLabels: Record<string, string> = {
  properties: "Properties",
  units: "Units",
  tenants: "Tenants",
};

export function ImportsHistorySection({
  history,
  historyUnavailable,
}: {
  history: ImportHistoryItem[];
  historyUnavailable: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold text-foreground">Import history</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Recent validation and commit attempts for this organization.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          {historyUnavailable ? "Unavailable" : `${history.length} recent`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-5 py-3 font-semibold sm:px-6">When</th>
              <th className="px-4 py-3 font-semibold">Dataset</th>
              <th className="px-4 py-3 font-semibold">Mode</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Rows</th>
              <th className="px-5 py-3 text-right font-semibold sm:px-6">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {history.map((run) => (
              <tr key={run.id} className="transition hover:bg-muted/15">
                <td className="px-5 py-4 text-muted-foreground sm:px-6">
                  {run.createdAt.toLocaleString("en-KE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-4 font-medium text-foreground">
                  {kindLabels[run.kind] ?? run.kind}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {run.mode === "DRY_RUN" ? "Validation" : "Commit"}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      run.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-red-500/10 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {run.status === "COMPLETED" ? "Completed" : "Failed"}
                  </span>
                  {run.errorCount > 0 ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                      {run.errorCount} error{run.errorCount === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 text-right text-muted-foreground">
                  {run.totalRows}
                </td>
                <td className="px-5 py-4 text-right font-semibold text-foreground sm:px-6">
                  {run.createdRows}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {historyUnavailable ? (
          <div className="border-t border-amber-500/20 bg-amber-500/10 px-5 py-10 text-center text-sm text-amber-800 dark:text-amber-200 sm:px-6">
            Import history is temporarily unavailable. You can still validate or upload a CSV.
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center border-t border-border px-5 py-12 text-center sm:px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/30">
              <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">No imports yet</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Run your first validation to preview row results. Successful commits will appear
              here with timestamps, row counts, and error summaries.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}