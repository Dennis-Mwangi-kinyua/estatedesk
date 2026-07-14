import { formatNumber } from "../../_components/control-plane";
import { pagerHref } from "../_lib/helpers";

export function MobileField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">{children}</div>
    </div>
  );
}

export function MobileEmpty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
      {label}
    </div>
  );
}

export function HiddenReturnTo({ value }: { value: string }) {
  return <input type="hidden" name="returnTo" value={value} />;
}

export function SectionPager({
  page,
  pageSize,
  total,
  pageKey,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  pageKey: string;
  params: URLSearchParams;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {formatNumber(from)}-{formatNumber(to)} of {formatNumber(total)}
      </p>
      <div className="grid min-w-0 grid-cols-3 gap-2 sm:flex sm:items-center">
        <a
          href={pagerHref(params, pageKey, page - 1)}
          aria-disabled={page <= 1}
          className={`min-w-0 whitespace-nowrap rounded-lg border border-slate-200 px-2 py-2 text-center font-medium sm:px-3 dark:border-white/10 ${
            page <= 1
              ? "pointer-events-none bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-600"
              : "bg-white text-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100"
          }`}
        >
          Previous
        </a>
        <span className="min-w-0 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center sm:px-3 dark:border-white/10 dark:bg-slate-900">
          {page} / {totalPages}
        </span>
        <a
          href={pagerHref(params, pageKey, page + 1)}
          aria-disabled={page >= totalPages}
          className={`min-w-0 whitespace-nowrap rounded-lg border border-slate-200 px-2 py-2 text-center font-medium sm:px-3 dark:border-white/10 ${
            page >= totalPages
              ? "pointer-events-none bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-600"
              : "bg-white text-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100"
          }`}
        >
          Next
        </a>
      </div>
    </div>
  );
}
