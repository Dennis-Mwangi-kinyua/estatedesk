import type { ComponentType, ReactNode } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export const panelBodyClassName = "p-5 sm:p-6";

type IconType = ComponentType<{ className?: string }>;

export function StatCard({
  label,
  value,
  note,
  highlight,
  href,
  icon: Icon,
}: {
  label: ReactNode;
  value: string | number;
  note?: ReactNode;
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-xs">
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
      className="group rounded-2xl border border-border bg-muted/10 px-4 py-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/20 hover:shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
      </div>
    </DeferredLink>
  );
}

export function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

export function FocusTaskCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  action,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-3 border-b border-border sm:flex-row sm:items-center sm:justify-between ${panelBodyClassName}`}>
      <div>
        <p className="text-sm text-muted-foreground">{eyebrow}</p>
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export function ErrorStateCard({
  title = "Could not load records",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/20 bg-background">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>

      <h3 className="mt-4 text-center text-base font-semibold text-foreground sm:text-lg">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-2xl whitespace-pre-wrap text-center text-sm leading-6 text-muted-foreground">
        {message}
      </p>

      <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-5 text-muted-foreground">
        If this keeps happening, contact your organization administrator.
      </p>
    </div>
  );
}

export function CaretakerWorkspaceFooter({ note }: { note?: string }) {
  return (
    <footer className="rounded-3xl border border-border bg-card px-4 py-4 text-xs text-muted-foreground sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} EstateDesk · Caretaker Dashboard
        </p>
        {note ? <p>{note}</p> : null}
      </div>
    </footer>
  );
}