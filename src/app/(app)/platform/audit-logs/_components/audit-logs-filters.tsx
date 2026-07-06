import Link from "next/link";
import { formatLabel } from "../_lib/helpers";

const fieldClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-white/30";

const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/20 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-white/30 dark:hover:bg-slate-800";

export function FiltersCard({
  q,
  action,
  actions,
  pageSize,
}: {
  q: string;
  action: string;
  actions: string[];
  pageSize: number;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <label
            htmlFor="q"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Actor, org, action, request ID, entity, IP, location..."
            className={fieldClassName}
          />
        </div>

        <div>
          <label
            htmlFor="action"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Action
          </label>
          <select
            id="action"
            name="action"
            defaultValue={action}
            className={fieldClassName}
          >
            <option value="">All actions</option>
            {actions.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="pageSize"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Per page
          </label>
          <select
            id="pageSize"
            name="pageSize"
            defaultValue={String(pageSize)}
            className={fieldClassName}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Apply filters
          </button>

          <Link href="/platform/audit-logs" className={secondaryButtonClassName}>
            Reset
          </Link>
        </div>
      </form>
    </section>
  );
}

export function EmptyState() {
  return (
    <div className="flex min-h-[220px] items-center justify-center px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-300">
      No audit logs found for the selected filters.
    </div>
  );
}