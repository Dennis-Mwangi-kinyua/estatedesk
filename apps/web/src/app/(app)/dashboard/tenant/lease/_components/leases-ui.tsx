import type { LeaseStatus } from "@prisma/client";
import { getLeaseStatusClasses } from "../_lib/helpers";

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export function LeaseStatusPill({ status }: { status: LeaseStatus | string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getLeaseStatusClasses(
        status as LeaseStatus,
      )}`}
    >
      {status}
    </span>
  );
}

export function SummaryMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-muted/10 px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-base font-semibold text-foreground [overflow-wrap:anywhere] sm:text-xl">{value}</p>
      {note ? (
        <p className="mt-1 break-words text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">{note}</p>
      ) : null}
    </div>
  );
}
