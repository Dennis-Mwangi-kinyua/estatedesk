import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { formatLedgerCurrency } from "@/lib/ledger";
import { formatStatusLabel, ratingTone } from "../_lib/helpers";
import type { TenantReportCardProps } from "../_lib/types";

export const panelShellClassName =
  "workspace-panel min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm";

export function RatingScore({ score }: { score: number }) {
  return <span aria-label={`Rating ${score} out of 5`} className="inline-flex rounded-lg border border-border bg-muted/20 px-2 py-1 text-xs font-semibold text-foreground">{score} / 5</span>;
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
      aria-current={active ? "page" : undefined}
      data-page-button="true"
      className={`inline-flex min-h-11 max-w-full items-center break-words rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
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
    <div className="report-stat h-full min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-medium leading-5 text-muted-foreground"><VisualSticker label={label} size="xs" />{label}</p>
          <p
            className={`mt-3 break-words text-2xl font-semibold tabular-nums ${
              highlight ? "text-red-600 dark:text-red-300" : "text-foreground"
            }`}
          >
            {value}
          </p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Icon aria-hidden="true" className="h-4 w-4" />
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
    <section className="workspace-panel min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-5 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-start gap-2 text-base font-semibold text-foreground"><VisualSticker label={title} size="xs" className="shrink-0" />{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-semibold text-muted-foreground">
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
              className="min-w-0 rounded-2xl border border-border bg-muted/15 p-4 transition hover:bg-muted/10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="ed-full-name whitespace-normal break-words [overflow-wrap:anywhere] text-sm font-semibold text-foreground">
                    {row.tenantName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.unitLabel}</p>
                </div>
                <span
                  className={`inline-flex w-fit max-w-full rounded-full border px-2.5 py-1 text-xs font-semibold ${ratingTone(row.rating.score)}`}
                >
                  {row.rating.label}
                </span>
              </div>

              <div className="mt-3 flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <RatingScore score={row.rating.score} />
                  <p className="mt-1 text-xs text-muted-foreground">{row.rating.detail}</p>
                </div>
                <div className="min-w-0 rounded-xl bg-card p-3 min-[480px]:text-right">
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