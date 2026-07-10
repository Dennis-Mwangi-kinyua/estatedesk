import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Home,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  approveMeterReading,
  rejectMeterReading,
} from "@/app/(app)/dashboard/org/notifications/actions";
import {
  formatDateTime,
  formatMoney,
  toNumber,
} from "@/app/(app)/dashboard/org/notifications/_lib/helpers";
import { formatWaterReadingRef } from "../../../_lib/helpers";
import {
  formatResolvedTenantLabel,
  resolveReadingTenant,
} from "../../../_lib/resolve-tenant";

type ReadingDetail = {
  id: string;
  period: string;
  prevReading: number;
  currentReading: number;
  unitsUsed: number;
  notes: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  submittedBy: { fullName: string; email: string | null };
  approvedBy: { fullName: string } | null;
  photoAsset: { key: string; fileName: string } | null;
  unit: {
    houseNo: string;
    building: { name: string } | null;
    property: {
      name: string;
      waterRatePerUnit: unknown;
      waterFixedCharge: unknown;
    };
    waterBills?: Array<{
      period: string;
      tenant: {
        fullName: string;
        phone?: string | null;
        status?: string | null;
        deletedAt?: Date | null;
      } | null;
    }>;
    leases: Array<{
      status: string;
      deletedAt?: Date | null;
      startDate?: Date | null;
      tenant: {
        fullName: string;
        phone?: string | null;
        status?: string | null;
        deletedAt?: Date | null;
      } | null;
    }>;
  };
};

export function ReadingDetailWorkspace({
  reading,
  currencyCode,
  timezone,
}: {
  reading: ReadingDetail;
  currencyCode: string;
  timezone: string;
}) {
  const rate = toNumber(reading.unit.property.waterRatePerUnit);
  const fixed = toNumber(reading.unit.property.waterFixedCharge);
  const projectedTotal = reading.unitsUsed * rate + fixed;
  const tenant = resolveReadingTenant({
    period: reading.period,
    waterBills: reading.unit.waterBills,
    leases: reading.unit.leases,
  });
  const tenantLabel = formatResolvedTenantLabel(tenant);
  const building = reading.unit.building?.name?.trim();
  const location = [reading.unit.property.name, building]
    .filter(Boolean)
    .join(" · ");
  const ref = formatWaterReadingRef(reading.id);
  const isPending = reading.status === "SUBMITTED";

  return (
    <div className="org-theme-content mx-auto w-full max-w-4xl space-y-5 px-4 pb-28 pt-4 sm:space-y-6 sm:px-6 lg:px-8">
      <div>
        <Link
          href="/dashboard/org/water-bills"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to water readings
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold tracking-wide text-sky-700 dark:text-sky-300">
                {ref}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                Reading summary
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Period {reading.period} · Submitted{" "}
                {formatDateTime(reading.createdAt, timezone)}
              </p>
            </div>
            <StatusPill status={reading.status} />
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {/* Unit card */}
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/10 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white dark:bg-sky-500">
              <Home className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground">
                Unit {reading.unit.houseNo}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{location}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserRound className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tenantLabel}</span>
              </p>
            </div>
          </div>

          {/* Vertical stack · each row left → right (label | value) */}
          <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
            <SummaryRow
              label="Previous"
              value={String(reading.prevReading)}
            />
            <SummaryRow
              label="Current"
              value={String(reading.currentReading)}
            />
            <SummaryRow
              label="Units used"
              value={String(reading.unitsUsed)}
            />
            <SummaryRow
              label="Rate / unit"
              value={formatMoney(rate, currencyCode)}
            />
            <SummaryRow
              label="Usage charge"
              value={formatMoney(reading.unitsUsed * rate, currencyCode)}
            />
            <SummaryRow
              label="Fixed charge"
              value={formatMoney(fixed, currencyCode)}
            />
            <SummaryRow
              label="Projected bill"
              value={formatMoney(projectedTotal, currencyCode)}
              emphasize
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
            <p>
              Submitted by{" "}
              <span className="font-medium text-foreground">
                {reading.submittedBy.fullName}
              </span>
              {reading.submittedBy.email
                ? ` (${reading.submittedBy.email})`
                : ""}
            </p>
            {reading.notes ? (
              <p className="mt-2 text-foreground">
                <span className="font-medium">Note:</span> {reading.notes}
              </p>
            ) : null}
            {reading.rejectionReason ? (
              <p className="mt-2 text-rose-700 dark:text-rose-300">
                <span className="font-medium">Rejection reason:</span>{" "}
                {reading.rejectionReason}
              </p>
            ) : null}
            {reading.approvedAt && reading.approvedBy ? (
              <p className="mt-2">
                Approved by {reading.approvedBy.fullName} on{" "}
                {formatDateTime(reading.approvedAt, timezone)}
              </p>
            ) : null}
          </div>

          {reading.photoAsset ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
                <Camera className="h-3.5 w-3.5" />
                Meter photo · {reading.photoAsset.fileName}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reading.photoAsset.key}
                alt={`Meter evidence for unit ${reading.unit.houseNo}`}
                className="max-h-96 w-full object-contain bg-muted/20"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
              No meter photo attached
            </div>
          )}

          {isPending ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <form action={approveMeterReading}>
                <input type="hidden" name="readingId" value={reading.id} />
                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve &amp; issue bill
                </button>
              </form>

              <form
                action={rejectMeterReading}
                className="space-y-3 rounded-2xl border border-border bg-muted/10 p-4 sm:col-span-2"
              >
                <input type="hidden" name="readingId" value={reading.id} />
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Rejection reason
                  </span>
                  <textarea
                    name="rejectionReason"
                    required
                    rows={3}
                    minLength={10}
                    placeholder="e.g. Photo unreadable — resubmit with clearer meter face"
                    className="min-h-[5.5rem] w-full resize-y rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 sm:w-auto sm:px-6"
                >
                  <XCircle className="h-4 w-4" />
                  Reject &amp; send back
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUBMITTED:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    APPROVED:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    REJECTED:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
  };
  const cls =
    map[status] ??
    "border-border bg-muted/20 text-muted-foreground";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${cls}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

function SummaryRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-row items-center justify-between gap-4 border-t border-border px-4 py-3.5 first:border-t-0 sm:px-5 sm:py-4 ${
        emphasize ? "bg-sky-50 dark:bg-sky-500/10" : ""
      }`}
    >
      <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`min-w-0 truncate text-right text-lg font-semibold tabular-nums tracking-tight sm:text-xl ${
          emphasize
            ? "text-sky-900 dark:text-sky-100"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
