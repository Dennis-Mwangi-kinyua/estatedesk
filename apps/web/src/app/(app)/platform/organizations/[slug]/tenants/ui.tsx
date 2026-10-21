import Link from "@/components/navigation/workspace-link";
export function Pager({ page, total, href }: { page: number; total: number; href: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / 20));
  return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"><span>{total} records · Page {page} of {pages}</span><div className="flex gap-3">{page > 1 ? <Link className="rounded-lg border px-4 py-2" href={href(page - 1)}>Previous</Link> : null}{page < pages ? <Link className="rounded-lg border px-4 py-2" href={href(page + 1)}>Next</Link> : null}</div></nav>;
}
export function Empty({ children = "No records found." }: { children?: React.ReactNode }) { return <p className="p-6 text-sm text-muted-foreground">{children}</p>; }
export const rowClass = "space-y-2 border-b border-border p-4 last:border-0";
export function formatTime(value?: Date | null) { return value ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }).format(value) : "—"; }
export function money(value: unknown, currency: string) { return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(Number(value ?? 0)); }
