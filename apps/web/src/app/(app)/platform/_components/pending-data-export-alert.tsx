import Link from "@/components/navigation/workspace-link";
import { FileArchive } from "lucide-react";
import { formatNumber } from "../_lib/helpers";
import type { PlatformDashboardData } from "../_lib/queries";

type Props = Pick<PlatformDashboardData, "pendingDataExportCount" | "recentDataExportRequests">;

export function PendingDataExportAlert({ count, requests }: {
  count: Props["pendingDataExportCount"];
  requests: Props["recentDataExportRequests"];
}) {
  if (count === 0) return null;

  return (
    <Link
      href="/platform/data-management"
      className="flex flex-col gap-3 rounded-xl border border-sky-300 bg-sky-50 p-4 text-sky-950 shadow-sm transition hover:border-sky-400 hover:bg-sky-100 dark:border-sky-400/40 dark:bg-sky-950/50 dark:text-sky-50 dark:hover:bg-sky-900/70 sm:flex-row sm:items-start sm:justify-between"
    >
      <span className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-200 text-sky-900 dark:bg-sky-400/20 dark:text-sky-100">
          <FileArchive className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">CSV export requests · {formatNumber(count)} awaiting review</span>
          <span className="mt-1 block text-sm text-sky-900/80 dark:text-sky-100/90">
            {requests.slice(0, 2).map((request) => `${request.org.name} · ${request.requestedBy.fullName}`).join("; ")}
            {requests.length === 0 ? "Review the pending organization export request." : ""}
          </span>
          {requests[0]?.reason ? <span className="mt-1 block line-clamp-2 text-xs text-sky-900/75 dark:text-sky-100/75">Latest reason: {requests[0].reason}</span> : null}
          {requests[0] ? <span className="mt-1 block text-xs font-medium">Requested delivery: {requests[0].deliveryMethod === "EMAIL" ? `email to ${requests[0].deliveryEmail ?? "address missing"}` : "secure download"}</span> : null}
        </span>
      </span>
      <span className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg bg-sky-900 px-3 text-xs font-semibold text-white dark:bg-sky-300 dark:text-sky-950">Review exports →</span>
    </Link>
  );
}
