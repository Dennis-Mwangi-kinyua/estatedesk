import Link from "next/link";
import type { ComponentType } from "react";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import type { InAppGuideTopic } from "@/lib/help/in-app-guides";
import { cn } from "@/lib/formatters";
import { formatEnumLabel } from "@/lib/formatters";
import type {
  NotificationFilter,
  OrgContext,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";

export const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

export const panelBodyClassName = "p-5 sm:p-6";

export const panelItemClassName =
  "rounded-2xl border border-border bg-background p-4 transition hover:bg-muted/10";

export const panelChipClassName =
  "rounded-full border border-border bg-muted/20 px-3 py-1 text-[11px] font-medium text-muted-foreground";

export const fieldClassName =
  "min-h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/15";

export const primaryButtonClassName =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90";

export const secondaryButtonClassName =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/20";

export function KpiTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  guideTopic,
  orgRole,
}: {
  title: string;
  message: string;
  guideTopic?: InAppGuideTopic;
  orgRole?: OrgContext["role"];
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{message}</p>
      {guideTopic ? (
        <div className="mt-3">
          <InAppGuideLink topic={guideTopic} workspace="org" orgRole={orgRole} />
        </div>
      ) : null}
    </div>
  );
}

export function PaymentStatusBadge({
  gatewayStatus,
  verificationStatus,
}: {
  gatewayStatus: string;
  verificationStatus: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-border bg-muted/20 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      {formatEnumLabel(gatewayStatus)} / {formatEnumLabel(verificationStatus)}
    </span>
  );
}

export function NotificationFilterLink({
  filter,
  activeFilter,
  label,
}: {
  filter: NotificationFilter;
  activeFilter: NotificationFilter;
  label: string;
}) {
  const active = filter === activeFilter;

  return (
    <Link
      href={`/dashboard/org/notifications?filter=${filter}`}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/20 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}