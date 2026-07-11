"use client";

import { useActionState, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import {
  DataCard,
  ResponsiveDataList,
} from "@/components/ui/responsive-data-list";
import { IMPORT_TEMPLATES } from "@/lib/imports/templates";
import type { ImportKind } from "@/lib/imports/types";
import { runCsvImportAction } from "./actions";
import { IMPORT_KIND_OPTIONS } from "./_lib/constants";
import {
  initialImportState,
  normalizeImportState,
} from "./import-state";

function countCsvRows(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return Math.max(0, lines.length - 1);
}

function downloadTemplate(kind: ImportKind) {
  const blob = new Blob([IMPORT_TEMPLATES[kind]], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `estatedesk-${kind}-template.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CsvImportForm() {
  const [kind, setKind] = useState<ImportKind>("properties");
  const [csv, setCsv] = useState(IMPORT_TEMPLATES.properties);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawState, action, pending] = useActionState(
    runCsvImportAction,
    initialImportState,
  );
  const state = useMemo(() => normalizeImportState(rawState), [rawState]);

  const currentKind = useMemo(
    () => IMPORT_KIND_OPTIONS.find((item) => item.value === kind) ?? IMPORT_KIND_OPTIONS[0],
    [kind],
  );

  const rowCount = useMemo(() => countCsvRows(csv), [csv]);

  const errorReportHref = useMemo(() => {
    if (
      state.errors.length === 0 &&
      state.rowResults.every((row) => row.errors.length === 0)
    ) {
      return null;
    }

    const headers = ["line", "label", "status", "errors"];
    const rows = state.rowResults.length
      ? state.rowResults
      : state.errors.map((error, index) => ({
          line: index + 1,
          label: "Import error",
          status: "error",
          errors: [error],
        }));
    const report = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.line,
          `"${String(row.label).replaceAll('"', '""')}"`,
          row.status,
          `"${row.errors.join(" | ").replaceAll('"', '""')}"`,
        ].join(","),
      ),
    ].join("\n");

    return `data:text/csv;charset=utf-8,${encodeURIComponent(report)}`;
  }, [state.errors, state.rowResults]);

  const hasRun = state.totalRows > 0 || state.errors.length > 0 || state.created > 0;
  const statusTone = pending
    ? "neutral"
    : !hasRun
      ? "neutral"
      : state.ok
        ? "success"
        : "error";

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          action={action}
          className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm"
        >
          <div className="border-b border-border px-5 py-5 sm:px-6">
            <p className="text-sm font-semibold text-foreground">Upload workspace</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a dataset, load your CSV, then validate before committing.
            </p>
          </div>

          <div className="space-y-6 px-5 py-5 sm:px-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">Import dataset</p>
                <button
                  type="button"
                  onClick={() => downloadTemplate(kind)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download template
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {IMPORT_KIND_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = kind === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setKind(option.value);
                        setCsv(IMPORT_TEMPLATES[option.value]);
                        setFileName(null);
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border bg-background hover:border-primary/40 hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {option.label}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {option.requiredColumns.length} required columns
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <input type="hidden" name="kind" value={kind} />

              <div className="rounded-2xl border border-border bg-muted/15 p-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  {currentKind.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentKind.requiredColumns.map((column) => (
                    <span
                      key={column}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                    >
                      {column}
                    </span>
                  ))}
                  {currentKind.optionalColumns.slice(0, 6).map((column) => (
                    <span
                      key={column}
                      className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {column}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="csvFile" className="text-sm font-semibold text-foreground">
                Upload CSV file
              </label>
              <label
                htmlFor="csvFile"
                className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-6 text-center transition hover:border-primary/40 hover:bg-muted/20"
              >
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  {fileName ? fileName : "Choose a CSV file or drag it here"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  UTF-8 CSV up to 500 rows
                </p>
                <input
                  id="csvFile"
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setFileName(file.name);
                    setCsv(await file.text());
                  }}
                />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="csv" className="text-sm font-semibold text-foreground">
                  CSV content
                </label>
                <span className="rounded-full border border-border bg-muted/20 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {rowCount} data row{rowCount === 1 ? "" : "s"}
                </span>
              </div>
              <textarea
                id="csv"
                name="csv"
                value={csv}
                onChange={(event) => {
                  setCsv(event.target.value);
                  setFileName(null);
                }}
                rows={12}
                spellCheck={false}
                className="w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 font-mono text-xs leading-6 text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border bg-muted/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="submit"
              name="mode"
              value="dry-run"
              disabled={pending}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted/30 disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                "Validate CSV"
              )}
            </button>
            <button
              type="submit"
              name="mode"
              value="commit"
              disabled={pending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Committing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Commit import
                </>
              )}
            </button>
          </div>
        </form>

        <aside
          className={`overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm ${
            statusTone === "success"
              ? "border-emerald-500/30"
              : statusTone === "error"
                ? "border-red-500/30"
                : "border-border"
          }`}
        >
          <div className="border-b border-border px-5 py-5">
            <div className="flex items-start gap-3">
              {pending ? (
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
              ) : statusTone === "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              ) : statusTone === "error" ? (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">Run summary</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {state.message}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 px-5 py-5">
            <ResultStat label="Rows parsed" value={state.totalRows} />
            <ResultStat label="Created" value={state.created} />
            <ResultStat label="Errors" value={state.errors.length} highlight={state.errors.length > 0} />
            <ResultStat label="Mode" value={state.dryRun ? "Validation" : "Commit"} />
          </div>

          {state.rollbackSummary ? (
            <div className="mx-5 mb-5 rounded-2xl border border-border bg-muted/15 p-3 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Transaction note</p>
              <p className="mt-1 leading-6">{state.rollbackSummary}</p>
            </div>
          ) : null}

          {state.preview.length > 0 ? (
            <div className="border-t border-border px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Preview
              </p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                {state.preview.map((item) => (
                  <li
                    key={item}
                    className="truncate rounded-xl border border-border bg-muted/10 px-3 py-2"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {state.errors.length > 0 ? (
            <div className="border-t border-border px-5 py-5">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                <p className="font-semibold">Errors</p>
                <ul className="mt-2 space-y-1">
                  {state.errors.slice(0, 8).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {errorReportHref ? (
            <div className="border-t border-border px-5 py-4">
              <a
                href={errorReportHref}
                download={`estatedesk-${state.kind}-import-errors.csv`}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted/20"
              >
                <Download className="h-4 w-4" />
                Download error report
              </a>
            </div>
          ) : null}
        </aside>
      </div>

      {state.rowResults.length > 0 ? (
        <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-semibold text-foreground">Row validation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Review every parsed row before committing the import.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-semibold text-muted-foreground">
              {state.rowResults.length} rows
            </span>
          </div>
          <ResponsiveDataList
            mobile={
              <ul className="divide-y divide-border">
                {state.rowResults.map((row) => (
                  <li key={`${row.line}-${row.label}`}>
                    <DataCard>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            Line {row.line}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {row.label}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            row.status === "valid"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-red-500/10 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {row.status === "valid" ? "Valid" : "Error"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {row.errors.length
                          ? row.errors.join(" ")
                          : "Ready to import"}
                      </p>
                    </DataCard>
                  </li>
                ))}
              </ul>
            }
            desktop={
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/15 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-5 py-3 font-semibold sm:px-6">Line</th>
                    <th className="px-4 py-3 font-semibold">Record</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {state.rowResults.map((row) => (
                    <tr
                      key={`${row.line}-${row.label}`}
                      className="hover:bg-muted/10"
                    >
                      <td className="px-5 py-3 font-semibold text-foreground sm:px-6">
                        {row.line}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.label}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            row.status === "valid"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-red-500/10 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {row.status === "valid" ? "Valid" : "Error"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground sm:px-6">
                        {row.errors.length
                          ? row.errors.join(" ")
                          : "Ready to import"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        </section>
      ) : null}
    </div>
  );
}

function ResultStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1 text-lg font-semibold ${
          highlight ? "text-red-600 dark:text-red-300" : "text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}