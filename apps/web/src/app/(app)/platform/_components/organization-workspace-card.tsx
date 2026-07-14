import Link from "next/link";
import type { ReactNode } from "react";
import { Building2, ChevronRight, Globe2 } from "lucide-react";
import {
  formatDate,
  formatNumber,
  formatSubscriptionSummary,
  getInitials,
  statusTone,
} from "../_lib/helpers";
import { StatusBadge } from "./platform-ui";

type OrganizationWorkspaceCardProps = {
  href: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  timezone?: string | null;
  createdAt: Date;
  layout?: "stacked" | "wide";
  colorVariant?: number;
  metrics: {
    properties: number;
    tenants: number;
    leases: number;
    staff: number;
    payments?: number;
  };
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd?: Date | null;
    trialEndsAt?: Date | null;
  } | null;
};

const cardShellClass =
  "group rounded-xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";

const organizationColorVariants = [
  {
    shell: "border-teal-200 bg-teal-50/70 hover:border-teal-300 dark:border-teal-400/20 dark:bg-teal-950/20 dark:hover:border-teal-400/35",
    avatar: "border-teal-200 bg-teal-700 text-white dark:border-teal-400/30 dark:bg-teal-400 dark:text-teal-950",
  },
  {
    shell: "border-violet-200 bg-violet-50/70 hover:border-violet-300 dark:border-violet-400/20 dark:bg-violet-950/20 dark:hover:border-violet-400/35",
    avatar: "border-violet-200 bg-violet-700 text-white dark:border-violet-400/30 dark:bg-violet-400 dark:text-violet-950",
  },
  {
    shell: "border-amber-200 bg-amber-50/70 hover:border-amber-300 dark:border-amber-400/20 dark:bg-amber-950/20 dark:hover:border-amber-400/35",
    avatar: "border-amber-200 bg-amber-600 text-white dark:border-amber-400/30 dark:bg-amber-400 dark:text-amber-950",
  },
  {
    shell: "border-sky-200 bg-sky-50/70 hover:border-sky-300 dark:border-sky-400/20 dark:bg-sky-950/20 dark:hover:border-sky-400/35",
    avatar: "border-sky-200 bg-sky-700 text-white dark:border-sky-400/30 dark:bg-sky-400 dark:text-sky-950",
  },
  {
    shell: "border-rose-200 bg-rose-50/70 hover:border-rose-300 dark:border-rose-400/20 dark:bg-rose-950/20 dark:hover:border-rose-400/35",
    avatar: "border-rose-200 bg-rose-700 text-white dark:border-rose-400/30 dark:bg-rose-400 dark:text-rose-950",
  },
  {
    shell: "border-indigo-200 bg-indigo-50/70 hover:border-indigo-300 dark:border-indigo-400/20 dark:bg-indigo-950/20 dark:hover:border-indigo-400/35",
    avatar: "border-indigo-200 bg-indigo-700 text-white dark:border-indigo-400/30 dark:bg-indigo-400 dark:text-indigo-950",
  },
] as const;

const neutralColorVariant = {
  shell: "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20",
  avatar: "border-slate-200 bg-slate-950 text-white dark:border-white/10 dark:bg-white dark:text-slate-950",
};

function getOrganizationColorVariant(colorVariant?: number) {
  if (colorVariant === undefined) return neutralColorVariant;
  return organizationColorVariants[Math.abs(colorVariant) % organizationColorVariants.length];
}

export function OrganizationWorkspaceCard(props: OrganizationWorkspaceCardProps) {
  if (props.layout === "wide") {
    return <WideOrganizationWorkspaceCard {...props} />;
  }

  return <StackedOrganizationWorkspaceCard {...props} />;
}

function StackedOrganizationWorkspaceCard(props: OrganizationWorkspaceCardProps) {
  const billing = formatSubscriptionSummary(props.subscription);
  const contact = props.email ?? props.phone ?? "No contact set";
  const colors = getOrganizationColorVariant(props.colorVariant);

  return (
    <Link href={props.href} className={`${cardShellClass} ${colors.shell} flex flex-col gap-3`}>
      <IdentityHeader
        name={props.name}
        slug={props.slug}
        contact={contact}
        status={props.status}
        avatarClassName={colors.avatar}
        trailing={
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
        }
      />

      <MetricsStrip metrics={props.metrics} />

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
        <BillingBlock billing={billing} payments={props.metrics.payments} />
        <MetaBlock
          createdAt={props.createdAt}
          timezone={props.timezone}
          showOpen={false}
        />
      </div>
    </Link>
  );
}

function WideOrganizationWorkspaceCard(props: OrganizationWorkspaceCardProps) {
  const billing = formatSubscriptionSummary(props.subscription);
  const contact = props.email ?? props.phone ?? "No contact set";
  const colors = getOrganizationColorVariant(props.colorVariant);

  return (
    <Link
      href={props.href}
      className={`${cardShellClass} ${colors.shell} flex min-w-0 flex-col gap-3 2xl:grid 2xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,1fr)_minmax(220px,0.85fr)_auto] 2xl:items-center 2xl:gap-6`}
    >
      <IdentityHeader
        name={props.name}
        slug={props.slug}
        contact={contact}
        status={props.status}
        avatarClassName={colors.avatar}
      />

      <MetricsStrip metrics={props.metrics} />

      <BillingBlock billing={billing} payments={props.metrics.payments} />

      <MetaBlock
        createdAt={props.createdAt}
        timezone={props.timezone}
        showOpen
      />
    </Link>
  );
}

function IdentityHeader({
  name,
  slug,
  contact,
  status,
  avatarClassName,
  trailing,
}: {
  name: string;
  slug: string;
  contact: string;
  status: string;
  avatarClassName: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold ${avatarClassName}`}>
          {getInitials(name)}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="min-w-0 break-words text-sm font-semibold leading-5 text-slate-950 dark:text-white">
              {name}
            </h3>
            <StatusBadge tone={statusTone(status)}>{status}</StatusBadge>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            /{slug}
          </p>
          <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">
            {contact}
          </p>
        </div>
      </div>

      {trailing}
    </div>
  );
}

function MetricsStrip({
  metrics,
}: {
  metrics: OrganizationWorkspaceCardProps["metrics"];
}) {
  return (
    <dl className="grid grid-cols-4 gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2.5 dark:border-white/10 dark:bg-slate-900">
      <MetricCell label="Properties" value={metrics.properties} />
      <MetricCell label="Tenants" value={metrics.tenants} />
      <MetricCell label="Leases" value={metrics.leases} />
      <MetricCell label="Staff" value={metrics.staff} />
    </dl>
  );
}

function BillingBlock({
  billing,
  payments,
}: {
  billing: ReturnType<typeof formatSubscriptionSummary>;
  payments?: number;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        Plan
      </p>
      <div className="mt-2">
        <span
          className={`platform-badge inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${billing.tone}`}
        >
          {billing.label}
        </span>
      </div>
      {billing.detail ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {billing.detail}
        </p>
      ) : null}
      {typeof payments === "number" ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {formatNumber(payments)} recorded payments
        </p>
      ) : null}
    </div>
  );
}

function MetaBlock({
  createdAt,
  timezone,
  showOpen,
}: {
  createdAt: Date;
  timezone?: string | null;
  showOpen: boolean;
}) {
  return (
    <div
      className={
        showOpen
          ? "flex flex-col items-end justify-center gap-2 text-right"
          : "shrink-0 text-right text-[11px] text-slate-500 dark:text-slate-400"
      }
    >
      <div className="space-y-1">
        <p>Created {formatDate(createdAt)}</p>
        {timezone ? (
          <p className="inline-flex max-w-full items-center justify-end gap-1">
            <Globe2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{timezone}</span>
          </p>
        ) : null}
      </div>
      {showOpen ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 transition group-hover:text-slate-950 dark:text-slate-200 dark:group-hover:text-white">
          Open
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      ) : null}
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-1 text-center">
      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
        {formatNumber(value)}
      </dd>
    </div>
  );
}

export function OrganizationWorkspaceCardEmpty() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
      <Building2 className="h-5 w-5 shrink-0" />
      No organizations to show yet.
    </div>
  );
}
