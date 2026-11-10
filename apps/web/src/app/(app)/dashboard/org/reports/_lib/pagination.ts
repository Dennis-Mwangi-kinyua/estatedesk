export const REPORT_PAGE_SIZE = 25;
/** Keep financial totals global while bounding the rows rendered into HTML/RSC. */
export function reportPage<T extends { tenantId: string; tenantName: string; amountDue: number; balance: number }>(rows: T[], requested?: string) {
  const pageCount = Math.max(1, Math.ceil(rows.length / REPORT_PAGE_SIZE));
  const parsed = Number(requested);
  const page = Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, pageCount) : 1;
  const sorted = [...rows].sort((a, b) => a.tenantName.localeCompare(b.tenantName) || a.tenantId.localeCompare(b.tenantId));
  const pageRows = sorted.slice((page - 1) * REPORT_PAGE_SIZE, page * REPORT_PAGE_SIZE);
  return { page, pageCount, totalRows: rows.length, paidCount: rows.filter(v => v.amountDue > 0 && v.balance <= 0).length, pageRows };
}
