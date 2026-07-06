import type { LucideIcon } from "lucide-react";
import { BarChart3 } from "lucide-react";
import {
  formatCurrency,
  paymentStatusTone,
} from "@/app/(app)/dashboard/landlord/_lib/helpers";
import type { LandlordUnit } from "@/app/(app)/dashboard/landlord/_lib/types";

export function InsightTile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-red-200 bg-red-50 text-red-800";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-75">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs leading-5 opacity-80">{detail}</p>
    </div>
  );
}

export function ReportTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-neutral-500">{label}</p>
          <p className="mt-1 truncate text-xl font-bold text-neutral-950">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-800 ring-1 ring-neutral-200">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-neutral-500">{detail}</p>
    </div>
  );
}

export function PropertyMiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-neutral-200">
      <p className="truncate text-[11px] font-medium text-neutral-500">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-neutral-950">
        {value}
      </p>
    </div>
  );
}

export function PaymentReportList({
  title,
  emptyText,
  units,
}: {
  title: string;
  emptyText: string;
  units: LandlordUnit[];
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-950">{title}</p>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
          {units.length}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {units.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-500">
            {emptyText}
          </p>
        ) : (
          units.slice(0, 6).map((unit) => (
            <div
              key={`${title}-${unit.houseNo}-${unit.tenantName}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-3 py-3 ring-1 ring-neutral-200"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {unit.tenantName}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Unit {unit.houseNo} · Paid {formatCurrency(unit.amountPaid)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentStatusTone(
                  unit.paymentStatus,
                )}`}
              >
                {Number(unit.balance ?? 0) <= 0
                  ? "PAID"
                  : formatCurrency(unit.balance)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function CollectionRateIcon() {
  return <BarChart3 className="h-5 w-5" />;
}