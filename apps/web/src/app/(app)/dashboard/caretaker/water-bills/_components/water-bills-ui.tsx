import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { encodePublicId } from "@/lib/public-id";
import { CURRENT_PERIOD } from "@/app/(app)/dashboard/caretaker/water-bills/_lib/types";

export function StatusBadge({
  label,
  tone,
  pulse = false,
}: {
  label: string;
  tone: "red" | "blue" | "green" | "neutral" | "violet";
  pulse?: boolean;
}) {
  const toneMap = {
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
    blue: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    neutral: "border-border bg-muted/20 text-muted-foreground",
    violet:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneMap[tone]} ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      {label}
    </span>
  );
}

export function MeterReadingCard({
  href,
  property,
  building,
  houseNo,
  tenant,
  previousReading,
  currentReading,
  unitsUsed,
  status,
  period,
  submittedAt,
}: {
  href: string;
  property: string;
  building: string;
  houseNo: string;
  tenant: string;
  previousReading: number | string;
  currentReading: number | string | null;
  unitsUsed: number | string | null;
  status: "NOT_SUBMITTED" | "SUBMITTED" | "APPROVED";
  period: string;
  submittedAt?: string;
}) {
  const isPendingSubmission = status === "NOT_SUBMITTED";

  return (
    <DeferredLink
      href={href}
      className="group block rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {property} · {building}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenant} · Period {period}
          </p>
        </div>

        <StatusBadge
          label={`Unit ${houseNo}`}
          tone={
            status === "NOT_SUBMITTED"
              ? "red"
              : status === "SUBMITTED"
                ? "blue"
                : "green"
          }
          pulse={isPendingSubmission}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-muted/10 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Previous
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {previousReading}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/10 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Current
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {currentReading ?? "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/10 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Units used
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {unitsUsed ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {status === "NOT_SUBMITTED" && "Pending caretaker submission"}
          {status === "SUBMITTED" &&
            `Submitted to office${submittedAt ? ` · ${submittedAt}` : ""}`}
          {status === "APPROVED" && "Approved by office"}
        </div>

        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          {status === "NOT_SUBMITTED" ? "Enter readings" : "Open"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </DeferredLink>
  );
}

export function IssuedBillCard({
  id,
  property,
  building,
  houseNo,
  tenant,
  unitsUsed,
  total,
  dueDate,
  period,
}: {
  id: string;
  property: string;
  building: string;
  houseNo: string;
  tenant: string;
  unitsUsed: unknown;
  total: string;
  dueDate: string;
  period: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {property} · {building}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenant} · Period {period}
          </p>
        </div>

        <StatusBadge label={`Unit ${houseNo}`} tone="violet" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-muted/10 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Units used
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {String(unitsUsed)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/10 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Total
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{total}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Due: {dueDate}</p>

        <Link
          href={getBillHref(id)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
        >
          Open bill
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function getPendingUnitHref(unitId: string) {
  return `/dashboard/caretaker/water-bills/read/${encodePublicId(
    unitId,
    "unit",
  )}?period=${CURRENT_PERIOD}`;
}

export function getReadingHref(readingId: string) {
  return `/dashboard/caretaker/water-bills/readings/${encodePublicId(
    readingId,
    "meter-reading",
  )}`;
}

export function getBillHref(billId: string) {
  return `/dashboard/caretaker/water-bills/bills/${encodePublicId(
    billId,
    "water-bill",
  )}`;
}