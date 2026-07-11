import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const panelShellClassName =
  "overflow-hidden rounded-2xl border border-border/90 bg-card text-card-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-3xl sm:shadow-sm";

export function SectionHeader({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-border px-4 py-3.5 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:px-6 sm:py-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" /> : null}
          <span className="min-w-0">{title}</span>
        </h2>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  Icon,
  compact = false,
  highlight = false,
}: {
  label: string;
  value: string;
  Icon?: LucideIcon;
  compact?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border ${
        highlight
          ? "border-primary/20 bg-primary/5"
          : "border-border bg-muted/10"
      } ${compact ? "px-3 py-3" : "px-4 py-4"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p
            className={`mt-1.5 font-semibold text-foreground ${
              compact ? "text-lg" : "text-2xl"
            }`}
          >
            {value}
          </p>
        </div>
        {Icon ? (
          <span
            className={`inline-flex shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-primary ${
              compact ? "h-8 w-8" : "h-10 w-10"
            }`}
          >
            <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function MetricPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "negative"
        ? "text-rose-700 dark:text-rose-300"
        : "text-foreground";

  return (
    <div className="rounded-xl border border-border/80 bg-background/80 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

export function FormPanel({
  title,
  description,
  icon: Icon,
  children,
  footer,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className={panelShellClassName}>
      <SectionHeader title={title} description={description} icon={Icon} />
      <div className="px-5 py-5 sm:px-6">{children}</div>
      {footer ? (
        <div className="border-t border-border bg-muted/10 px-5 py-4 sm:px-6">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function EmptyState({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm leading-6 text-muted-foreground ${className}`}
    >
      {children}
    </p>
  );
}