import Link from "next/link";
import { memo } from "react";
import { TenantAdminActions } from "../TenantAdminActions";
import {
  formatBoolean,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatus,
  getInitials,
  getLeaseUnitLabel,
  getStatusClasses,
  getUnitLabel,
  imageUrl,
} from "../_lib/helpers";

export {
  formatBoolean,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatus,
  getInitials,
  getLeaseUnitLabel,
  getStatusClasses,
  getUnitLabel,
  imageUrl,
};

export const DetailItem = memo(function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl ed-theme-card border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className={`mt-2 break-words text-sm text-foreground ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
});

export const SectionHeader = memo(function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
});

export const SummaryStat = memo(function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
});

export const TenantHeroCard = memo(function TenantHeroCard({
  fullName,
  status,
  type,
  email,
  phone,
  currentUnit,
  currentRent,
  canManage,
  initials,
  tenantId,
  hasActiveLease,
  isDeleted,
  isBlacklisted,
  isArchived,
}: {
  fullName: string;
  status: string;
  type: string;
  email: string | null;
  phone: string | null;
  currentUnit: string;
  currentRent: string;
  canManage: boolean;
  initials: string;
  tenantId: string;
  hasActiveLease: boolean;
  isDeleted: boolean;
  isBlacklisted: boolean;
  isArchived: boolean;
}) {
  return (
    <section className="rounded-[28px] ed-theme-card border border-border bg-card p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-base font-semibold text-white">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <Link
            href="/dashboard/org/tenants"
            className="inline-flex text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Back to tenants
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-foreground sm:text-2xl">
              {fullName}
            </h1>

            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                status,
              )}`}
            >
              {formatStatus(status)}
            </span>

            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {formatStatus(type)}
            </span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {email || "No email"} • {phone || "No phone"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SummaryStat label="Current unit" value={currentUnit} />
        <SummaryStat label="Monthly rent" value={currentRent} />
      </div>

      {canManage ? (
        <div className="mt-4">
          <TenantAdminActions
            tenantId={tenantId}
            hasActiveLease={hasActiveLease}
            isDeleted={isDeleted}
            isBlacklisted={isBlacklisted}
            isArchived={isArchived}
          />
        </div>
      ) : null}
    </section>
  );
});
