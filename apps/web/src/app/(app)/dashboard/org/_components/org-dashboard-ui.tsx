import type { ComponentType, ReactNode } from "react";
import { DeferredLink } from "@/components/navigation/app-links";

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

type IconType = ComponentType<{ className?: string }>;

export function StatCard({
  label,
  value,
  note,
  highlight,
  href,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note?: string;
  highlight?: "default" | "warning" | "success";
  href?: string;
  icon?: IconType;
}) {
  const valueClassName =
    highlight === "warning"
      ? "text-amber-700 dark:text-amber-200"
      : highlight === "success"
        ? "text-emerald-700 dark:text-emerald-200"
        : "text-foreground";

  const content = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
          {label}
        </p>
        <p className={`mt-2 text-2xl font-semibold ${valueClassName}`}>{value}</p>
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
  );

  const className =
    "rounded-2xl border border-border bg-muted/10 px-4 py-4 transition hover:border-border/80 hover:bg-muted/15";

  if (href) {
    return (
      <DeferredLink href={href} className={`group block ${className}`}>
        {content}
      </DeferredLink>
    );
  }

  return <div className={className}>{content}</div>;
}

export function QuickLinkCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: IconType;
}) {
  return (
    <DeferredLink
      href={href}
      className="group rounded-2xl border border-border bg-muted/10 px-4 py-4 transition hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted/20 hover:shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </DeferredLink>
  );
}

export function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={`${panelShellClassName} p-5`}>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}