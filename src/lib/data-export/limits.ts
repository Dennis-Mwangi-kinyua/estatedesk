import "server-only";

const DEFAULT_SYNC_EXPORT_ROW_LIMIT = 50_000;

function readPositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const SYNC_EXPORT_ROW_LIMIT = readPositiveInt(
  process.env.SYNC_EXPORT_ROW_LIMIT,
  DEFAULT_SYNC_EXPORT_ROW_LIMIT,
);

export class DataExportTooLargeError extends Error {
  readonly statusCode = 413;

  constructor(
    readonly dataset: string,
    readonly rowLimit: number,
  ) {
    super(
      `${dataset} exceeds the synchronous export limit of ${rowLimit.toLocaleString()} rows.`,
    );
    this.name = "DataExportTooLargeError";
  }
}

export function assertWithinSyncExportLimit<T>(
  dataset: string,
  rows: T[],
  rowLimit = SYNC_EXPORT_ROW_LIMIT,
) {
  if (rows.length > rowLimit) {
    throw new DataExportTooLargeError(dataset, rowLimit);
  }

  return rows;
}

export function syncExportTake(rowLimit = SYNC_EXPORT_ROW_LIMIT) {
  return rowLimit + 1;
}
