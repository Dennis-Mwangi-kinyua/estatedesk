import Link from "next/link";

export function buildHref({
  page,
  q,
  action,
  pageSize,
}: {
  page: number;
  q?: string;
  action?: string;
  pageSize?: number;
}) {
  const params = new URLSearchParams();

  params.set("page", String(page));

  if (q) params.set("q", q);
  if (action) params.set("action", action);
  if (pageSize) params.set("pageSize", String(pageSize));

  return `/platform/audit-logs?${params.toString()}`;
}

export function Pagination({
  page,
  totalPages,
  q,
  action,
  pageSize,
}: {
  page: number;
  totalPages: number;
  q: string;
  action: string;
  pageSize: number;
}) {
  const previousHref = buildHref({
    page: page - 1,
    q,
    action,
    pageSize,
  });

  const nextHref = buildHref({
    page: page + 1,
    q,
    action,
    pageSize,
  });

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Page {page} of {totalPages}
      </p>

      <div className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          href={page <= 1 ? "#" : previousHref}
          className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium dark:border-white/10 ${
            page <= 1
              ? "pointer-events-none bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-600"
              : "bg-white text-slate-800 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Previous
        </Link>

        <Link
          aria-disabled={page >= totalPages}
          href={page >= totalPages ? "#" : nextHref}
          className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium dark:border-white/10 ${
            page >= totalPages
              ? "pointer-events-none bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-600"
              : "bg-white text-slate-800 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}