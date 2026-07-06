import type { ComponentType } from "react";
import { DeferredLink } from "@/components/navigation/app-links";

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

type IconType = ComponentType<{ className?: string }>;

export function StatCard({
  label,
  value,
  note,
  highlight,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note?: string;
  highlight?: "default" | "warning" | "success";
  icon?: IconType;
}) {
  const valueClassName =
    highlight === "warning"
      ? "text-amber-700 dark:text-amber-200"
      : highlight === "success"
        ? "text-emerald-700 dark:text-emerald-200"
        : "text-foreground";

  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
            {label}
          </p>
          <p className={`mt-2 break-words text-2xl font-semibold ${valueClassName}`}>
            {value}
          </p>
          {note ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{note}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/20 text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsNavCard({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: IconType;
}) {
  return (
    <DeferredLink
      href={href}
      className="group flex min-h-32 items-start rounded-2xl border border-border bg-muted/10 p-5 transition hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted/15 hover:shadow-sm"
    >
      <span className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition group-hover:text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">{label}</span>
          <span className="mt-2 block text-sm leading-6 text-muted-foreground">
            {description}
          </span>
        </span>
      </span>
    </DeferredLink>
  );
}