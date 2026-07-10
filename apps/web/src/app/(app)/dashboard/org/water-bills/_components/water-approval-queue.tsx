import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Droplets,
  Home,
  UserRound,
} from "lucide-react";
import {
  formatDateTime,
  formatMoney,
  toNumber,
} from "@/app/(app)/dashboard/org/notifications/_lib/helpers";
import type {
  ApprovalQueueItem,
  OrgContext,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";
import {
  formatWaterReadingRef,
  getOrgWaterReadingHref,
} from "../_lib/helpers";
import {
  formatResolvedTenantLabel,
  resolveReadingTenant,
} from "../_lib/resolve-tenant";

type WaterApprovalQueueProps = {
  membership: OrgContext;
  approvalQueue: ApprovalQueueItem[];
  approvalQueueCount: number;
};

type ReadingWithExtras = ApprovalQueueItem & {
  notes?: string | null;
  unit: ApprovalQueueItem["unit"] & {
    building?: { name: string } | null;
    waterBills?: Array<{
      period: string;
      tenant: {
        fullName: string;
        phone?: string | null;
        status?: string | null;
        deletedAt?: Date | null;
      } | null;
    }>;
    leases?: Array<{
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

export function WaterApprovalQueue({
  membership,
  approvalQueue,
  approvalQueueCount,
}: WaterApprovalQueueProps) {
  const currency = membership.org.currencyCode;
  const timezone = membership.org.timezone;

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Review queue
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Meter reading approvals
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              Each card is one reading. Open the ID for the full summary, photo,
              and approve / reject actions.
            </p>
          </div>
          {approvalQueueCount > 0 ? (
            <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              {approvalQueueCount} pending
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-7">
        {approvalQueue.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/10 px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-border bg-background shadow-sm">
              <Droplets className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-5 text-base font-semibold text-foreground">
              Nothing waiting for review
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              When caretakers submit unit readings, they will show here as
              approval cards with a reading ID.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {approvalQueue.map((item) => {
              const reading = item as ReadingWithExtras;
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
              const href = getOrgWaterReadingHref(reading.id);
              const hasPhoto = Boolean(reading.photoAsset);

              const metrics = [
                {
                  label: "Previous",
                  value: String(reading.prevReading),
                },
                {
                  label: "Current",
                  value: String(reading.currentReading),
                },
                {
                  label: "Units used",
                  value: String(reading.unitsUsed),
                },
                {
                  label: "Bill",
                  value: formatMoney(projectedTotal, currency),
                  emphasize: true as const,
                },
              ];

              return (
                <Link
                  key={reading.id}
                  href={href}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300/60 hover:shadow-md dark:hover:border-sky-500/40"
                >
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/15 px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 font-mono text-sm font-bold tracking-wide text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-100">
                          {ref}
                        </span>
                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                          Pending review
                        </span>
                        {hasPhoto ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            <Camera className="h-3 w-3" />
                            Photo
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Period{" "}
                        <span className="font-medium text-foreground">
                          {reading.period}
                        </span>
                        {" · "}
                        {formatDateTime(reading.createdAt, timezone)}
                      </p>
                    </div>
                  </div>

                  {/*
                    Body: one vertical column.
                    Unit block, then metrics stacked top→bottom.
                    Each metric row is left→right (label | value).
                  */}
                  <div className="flex flex-1 flex-col gap-4 px-5 py-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm dark:bg-sky-500">
                        <Home className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xl font-semibold tracking-tight text-foreground">
                          Unit {reading.unit.houseNo}
                        </p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {location}
                        </p>
                        <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-foreground">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground">
                            <UserRound className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate font-medium">
                            {tenantLabel}
                          </span>
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Submitted by {reading.submittedBy.fullName}
                        </p>
                      </div>
                    </div>

                    {/* Vertical list · each row left → right */}
                    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                      {metrics.map((cell, index) => (
                        <div
                          key={cell.label}
                          className={`flex w-full flex-row items-center justify-between gap-4 px-4 py-3.5 sm:px-5 sm:py-4 ${
                            index > 0 ? "border-t border-border" : ""
                          } ${
                            cell.emphasize
                              ? "bg-sky-50 dark:bg-sky-500/10"
                              : ""
                          }`}
                        >
                          <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            {cell.label}
                          </p>
                          <p
                            className={`min-w-0 truncate text-right text-lg font-semibold tabular-nums tracking-tight sm:text-xl ${
                              cell.emphasize
                                ? "text-sky-900 dark:text-sky-100"
                                : "text-foreground"
                            }`}
                          >
                            {cell.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA footer */}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-border bg-muted/10 px-5 py-4">
                    <p className="text-sm text-muted-foreground">
                      Open full summary
                    </p>
                    <span className="inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition group-hover:bg-primary/90">
                      Review {ref}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
