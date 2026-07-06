import { Star, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { formatLedgerCurrency } from "@/lib/ledger";
import { formatStatusLabel, ratingTone } from "../_lib/helpers";
import type { TenantReportCardProps } from "../_lib/types";

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export function Stars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${score} star rating`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < score
              ? "fill-current text-amber-500"
              : "text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

export function ReportFilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/20 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

export function ReportStat({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p
            className={`mt-1 text-xl font-bold ${
              highlight ? "text-red-600 dark:text-red-300" : "text-foreground"
            }`}
          >
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
    </div>
  );
}

export function TenantReportCard({
  title,
  description,
  emptyText,
  rows,
  showRentGuideWhenEmpty = false,
  orgRole,
}: TenantReportCardProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-semibold text-muted-foreground">
          {rows.length}
        </span>
      </div>

      <div className="space-y-3 p-5 sm:p-6">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-5 text-sm text-muted-foreground">
            <p>{emptyText}</p>
            {showRentGuideWhenEmpty ? (
              <div className="mt-3">
                <InAppGuideLink topic="rent" workspace="org" orgRole={orgRole} />
              </div>
            ) : null}
          </div>
        ) : (
          rows.map((row) => (
            <article
              key={row.tenantId}
              className="rounded-2xl border border-border bg-background p-4 transition hover:bg-muted/10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {row.tenantName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.unitLabel}</p>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${ratingTone(row.rating.score)}`}
                >
                  {row.rating.label}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <Stars score={row.rating.score} />
                  <p className="mt-1 text-xs text-muted-foreground">{row.rating.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {row.daysPastDue > 0 ? `${row.daysPastDue} days past due` : "Within period"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatLedgerCurrency(row.balance)} balance
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export { formatStatusLabel };