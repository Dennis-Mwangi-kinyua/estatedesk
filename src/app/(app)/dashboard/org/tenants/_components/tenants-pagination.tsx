import { DeferredLink } from "@/components/navigation/app-links";
import type { TenantFilterStatus } from "../_lib/types";

export function TenantsPagination({
  page,
  pageSize,
  total,
  search,
  status,
  created,
}: {
  page: number;
  pageSize: number;
  total: number;
  search: string;
  status: TenantFilterStatus;
  created: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  function href(nextPage: number) {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (created) params.set("created", "1");
    params.set("page", String(nextPage));
    params.set("pageSize", String(pageSize));

    return `/dashboard/org/tenants?${params.toString()}`;
  }

  if (total <= to && page === 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <DeferredLink
            href={href(Math.max(1, page - 1))}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            Previous
          </DeferredLink>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-2xl border border-border bg-muted/30 px-4 text-sm font-medium text-muted-foreground">
            Previous
          </span>
        )}
        <span className="rounded-2xl border border-border bg-muted/20 px-3 py-2 text-sm font-semibold text-foreground">
          {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <DeferredLink
            href={href(Math.min(totalPages, page + 1))}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
          >
            Next
          </DeferredLink>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-2xl border border-border bg-muted/30 px-4 text-sm font-medium text-muted-foreground">
            Next
          </span>
        )}
      </div>
    </div>
  );
}