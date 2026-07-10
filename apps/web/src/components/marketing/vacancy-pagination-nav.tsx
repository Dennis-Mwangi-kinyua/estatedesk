import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VacancyPaginationState } from "@/lib/vacancy-pagination";
import { buildVacancyPageHref } from "@/lib/vacancy-pagination";

type VacancyPaginationNavProps = {
  ariaLabel: string;
  basePath: string;
  pagination: VacancyPaginationState;
  pageParam?: string;
  searchParams?: Record<string, string | number | undefined | null>;
  itemLabel?: string;
};

export function VacancyPaginationNav({
  ariaLabel,
  basePath,
  pagination,
  pageParam = "page",
  searchParams = {},
  itemLabel = "items",
}: VacancyPaginationNavProps) {
  if (pagination.pageCount <= 1) return null;

  const previousHref =
    pagination.currentPage > 1
      ? buildVacancyPageHref(basePath, pagination.currentPage - 1, searchParams, pageParam)
      : null;
  const nextHref =
    pagination.currentPage < pagination.pageCount
      ? buildVacancyPageHref(basePath, pagination.currentPage + 1, searchParams, pageParam)
      : null;

  return (
    <nav
      className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_42px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-slate-900 dark:shadow-none sm:p-4"
      aria-label={ariaLabel}
    >
      <div className="mb-3 flex flex-col items-center justify-center gap-1 border-b border-slate-100 pb-3 text-center dark:border-white/10 sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">
          Page {pagination.currentPage} of {pagination.pageCount}
        </p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Showing {pagination.start + 1}-{pagination.end} of {pagination.total} {itemLabel}
        </p>
      </div>
      <div className="grid w-full grid-cols-2 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
        {previousHref ? (
          <Link
            href={previousHref}
            rel="prev"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 dark:border-white/20 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-cyan-200 dark:hover:bg-cyan-200/15 dark:hover:text-cyan-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        ) : (
          <span className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-500">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </span>
        )}
        <span className="hidden h-11 min-w-28 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-sm dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 sm:inline-flex">
          {pagination.currentPage} / {pagination.pageCount}
        </span>
        {nextHref ? (
          <Link
            href={nextHref}
            rel="next"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-200 px-3 text-sm font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}