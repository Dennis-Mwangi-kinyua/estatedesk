import Link from "next/link";
import type { PropertiesPageData } from "../_lib/types";
import { buildPageHref } from "../_lib/helpers";

export function PropertiesPaginationSection({ data }: { data: PropertiesPageData }) {
  const { query, type, status, created, showingFrom, showingTo, filteredTotal, safeCurrentPage, totalPages } = data;
  const prevHref = buildPageHref({ page: safeCurrentPage - 1, q: query || undefined, type, status, created: created ? "1" : undefined });
  const nextHref = buildPageHref({ page: safeCurrentPage + 1, q: query || undefined, type, status, created: created ? "1" : undefined });
  return (
          <div className="flex flex-col gap-4 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-sm text-neutral-500">
              Showing {showingFrom}-{showingTo} of {filteredTotal}
            </div>

            <div className="flex items-center gap-3">
              {safeCurrentPage > 1 ? (
                <Link
                  href={prevHref}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  Previous
                </Link>
              ) : (
                <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-400">
                  Previous
                </span>
              )}

              <div className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700">
                {safeCurrentPage} / {totalPages}
              </div>

              {safeCurrentPage < totalPages ? (
                <Link
                  href={nextHref}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  Next
                </Link>
              ) : (
                <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-400">
                  Next
                </span>
              )}
            </div>
          </div>
  );
}
