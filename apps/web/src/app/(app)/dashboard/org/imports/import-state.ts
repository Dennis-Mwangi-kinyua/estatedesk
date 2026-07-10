import type { ImportResult } from "@/lib/imports/csv-import";

export type ImportActionState = ImportResult & {
  message: string;
  runId?: string;
};

export const initialImportState: ImportActionState = {
  ok: true,
  dryRun: true,
  kind: "properties",
  totalRows: 0,
  validRows: 0,
  created: 0,
  errors: [],
  preview: [],
  rowResults: [],
  rollbackSummary: undefined,
  message: "Paste a CSV and run validation before committing records.",
};

export function normalizeImportState(
  state: ImportActionState | undefined,
): ImportActionState {
  if (!state) {
    return initialImportState;
  }

  return {
    ...initialImportState,
    ...state,
    errors: state.errors ?? [],
    preview: state.preview ?? [],
    rowResults: (state.rowResults ?? []).map((row) => ({
      line: row.line,
      label: row.label,
      status: row.status,
      errors: row.errors ?? [],
    })),
  };
}