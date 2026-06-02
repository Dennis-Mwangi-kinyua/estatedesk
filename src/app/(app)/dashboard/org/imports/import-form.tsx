"use client";

import { useActionState, useMemo, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from "lucide-react";
import { IMPORT_TEMPLATES } from "@/lib/imports/templates";
import type { ImportKind } from "@/lib/imports/types";
import {
  initialImportState,
  runCsvImportAction,
} from "./actions";

const importKinds: Array<{ value: ImportKind; label: string; helper: string }> = [
  {
    value: "properties",
    label: "Properties",
    helper: "Required: name. Optional: location, address, type, water charges, notes.",
  },
  {
    value: "units",
    label: "Units",
    helper: "Required: propertyName, houseNo, rentAmount. Building names are created when missing.",
  },
  {
    value: "tenants",
    label: "Tenants",
    helper: "Required: fullName, phone. Optional unit fields can create an active lease.",
  },
];

export function CsvImportForm() {
  const [kind, setKind] = useState<ImportKind>("properties");
  const [csv, setCsv] = useState(IMPORT_TEMPLATES.properties);
  const [state, action, pending] = useActionState(
    runCsvImportAction,
    initialImportState,
  );
  const currentKind = useMemo(
    () => importKinds.find((item) => item.value === kind) ?? importKinds[0],
    [kind],
  );
  const errorReportHref = useMemo(() => {
    if (state.errors.length === 0 && state.rowResults.every((row) => row.errors.length === 0)) {
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
    const csv = [
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

    return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  }, [state.errors, state.rowResults]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <form action={action} className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-950">CSV import</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
              Validate first, then commit. Imports are capped at 500 rows per run and
              committed in a single transaction so failed imports roll back cleanly.
            </p>
          </div>
          <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
        </div>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="kind" className="text-sm font-semibold text-neutral-800">
              Import type
            </label>
            <select
              id="kind"
              name="kind"
              value={kind}
              onChange={(event) => {
                const next = event.target.value as ImportKind;
                setKind(next);
                setCsv(IMPORT_TEMPLATES[next]);
              }}
              className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
            >
              {importKinds.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">{currentKind.helper}</p>
          </div>

          <div className="grid gap-2">
            <label htmlFor="csvFile" className="text-sm font-semibold text-neutral-800">
              Upload CSV file
            </label>
            <input
              id="csvFile"
              type="file"
              accept=".csv,text/csv"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setCsv(await file.text());
              }}
              className="min-h-12 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="csv" className="text-sm font-semibold text-neutral-800">
              CSV content
            </label>
            <textarea
              id="csv"
              name="csv"
              value={csv}
              onChange={(event) => setCsv(event.target.value)}
              rows={12}
              className="w-full resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-3 font-mono text-xs leading-6 text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              name="mode"
              value="dry-run"
              disabled={pending}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
            >
              Validate CSV
            </button>
            <button
              type="submit"
              name="mode"
              value="commit"
              disabled={pending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              Commit import
            </button>
          </div>
        </div>
      </form>

      <aside className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {state.ok ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          )}
          <div>
            <p className="text-sm font-semibold text-neutral-950">Import result</p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">{state.message}</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <ResultStat label="Rows" value={state.totalRows} />
          <ResultStat label="Created" value={state.created} />
          <ResultStat label="Errors" value={state.errors.length} />
          <ResultStat label="Mode" value={state.dryRun ? "Dry run" : "Commit"} />
        </dl>

        {state.rollbackSummary ? (
          <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-950">Rollback summary</p>
            <p className="mt-1 leading-6">{state.rollbackSummary}</p>
          </div>
        ) : null}

        {state.preview.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Preview
            </p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-700">
              {state.preview.map((item) => (
                <li key={item} className="truncate rounded-xl bg-neutral-50 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {state.errors.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">Errors</p>
            <ul className="mt-2 space-y-1">
              {state.errors.slice(0, 8).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {errorReportHref ? (
          <a
            href={errorReportHref}
            download={`estatedesk-${state.kind}-import-errors.csv`}
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            <Download className="h-4 w-4" />
            Download error report
          </a>
        ) : null}
      </aside>

      {state.rowResults.length > 0 ? (
        <section className="ios-panel rounded-[28px] p-4 sm:p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-950">Row validation</p>
              <p className="mt-1 text-sm text-neutral-500">
                Review every parsed row before committing the import.
              </p>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
              {state.rowResults.length} rows
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-[0.12em] text-neutral-500">
                  <th className="py-3 pr-4 font-semibold">Line</th>
                  <th className="px-4 py-3 font-semibold">Record</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="py-3 pl-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {state.rowResults.map((row) => (
                  <tr key={`${row.line}-${row.label}`}>
                    <td className="py-3 pr-4 font-semibold text-neutral-950">{row.line}</td>
                    <td className="px-4 py-3 text-neutral-700">{row.label}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.status === "valid"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-neutral-600">
                      {row.errors.length ? row.errors.join(" ") : "Ready to import"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-1 font-semibold text-neutral-950">{value}</dd>
    </div>
  );
}
