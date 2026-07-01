import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  BadgeCheck,
  Building2,
  CreditCard,
  FileArchive,
  Globe2,
  KeyRound,
  Settings2,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import type { Member, SettingsPageData } from "./settings-data";
import { formatLabel } from "./settings-data";

export function SectionCard({
  id,
  hidden = false,
  title,
  description,
  action,
  children,
}: {
  id?: string;
  hidden?: boolean;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={[
        "scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/90",
        hidden ? "hidden" : "",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5 dark:border-white/10">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function OverviewCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
}) {
  const Icon = icon;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/90 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 break-words text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            {value}
          </p>
          <p className="mt-2 text-sm leading-5 text-slate-500">{hint}</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function InputField({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

export function TextAreaField({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: string[];
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ToggleField({
  label,
  description,
  name,
  defaultChecked,
}: {
  label: string;
  description?: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/70 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>

      <span className="relative mt-1 shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <span className="block h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-slate-900" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function StatusBadge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "muted";
}) {
  const styles = {
    default: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-slate-200 bg-slate-50 text-slate-700",
    warning: "border-slate-200 bg-slate-50 text-slate-700",
    danger: "border-slate-200 bg-slate-50 text-slate-700",
    muted: "border-slate-200 bg-slate-50 text-slate-600",
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="break-words text-sm font-medium text-slate-900 sm:text-right">
        {value}
      </span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center sm:px-5 sm:py-10">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export function MemberMobileCard({ member }: { member: Member }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-slate-950">
            {member.name}
          </p>
          <p className="mt-1 break-all text-xs text-slate-500">
            {member.email}
          </p>
        </div>

        <StatusBadge
          label={formatLabel(member.status)}
          variant={
            member.status === "ACTIVE"
              ? "success"
              : member.status === "SUSPENDED"
                ? "warning"
                : "danger"
          }
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/10">
        <span className="text-xs text-slate-500">Role</span>
        <StatusBadge label={formatLabel(member.role)} variant="default" />
      </div>
    </article>
  );
}

export function SmallInfoCard({
  icon,
  title,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: ReactNode;
}) {
  const Icon = icon;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/70">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <div className="mt-1 break-words text-sm leading-6 text-slate-500">
          {value}
        </div>
      </div>
    </div>
  );
}

export const SETTINGS_NAV_ITEMS = [
  {
    id: "organization-profile",
    href: "/dashboard/org/settings/organization-profile",
    label: "Organization Profile",
    description: "Company profile, contact details, timezone, and currency.",
    icon: Building2,
  },
  {
    id: "organization-summary",
    href: "/dashboard/org/settings/organization-summary",
    label: "Organization Summary",
    description: "A quick read-only snapshot of workspace identity and status.",
    icon: BadgeCheck,
  },
  {
    id: "billing",
    href: "/dashboard/org/settings/billing",
    label: "Billing",
    description: "Current plan, renewal date, billing email, and plan changes.",
    icon: CreditCard,
  },
  {
    id: "workspace-preferences",
    href: "/dashboard/org/settings/workspace-preferences",
    label: "Workspace Preferences",
    description: "Theme, modules, tenant portal, issue tracking, and notifications.",
    icon: Settings2,
  },
  {
    id: "payment-instructions",
    href: "/dashboard/org/settings/payment-instructions",
    label: "Payment Instructions",
    description: "M-Pesa and bank instructions shown to tenants at checkout.",
    icon: Wallet,
  },
  {
    id: "users-access",
    href: "/dashboard/org/settings/users-access",
    label: "Users & Access",
    description: "Invite members and review organization roles and status.",
    icon: Users,
  },
  {
    id: "api-keys",
    href: "/dashboard/org/settings/api-keys",
    label: "API Keys",
    description: "Create, review, revoke, and reactivate integration keys.",
    icon: KeyRound,
  },
  {
    id: "contact-region",
    href: "/dashboard/org/settings/contact-region",
    label: "Contact & Region",
    description: "Primary email, phone, address, and timezone details.",
    icon: Globe2,
  },
  {
    id: "security-access",
    href: "/dashboard/org/settings/security-access",
    label: "Security & Access",
    description: "Administrative summary of members, API keys, and renewal status.",
    icon: ShieldCheck,
  },
  {
    id: "data-export",
    href: "/dashboard/org/settings/data-export",
    label: "Data Export",
    description: "Request reviewed CSV archives and download approved exports.",
    icon: FileArchive,
  },
] as const;

export type SettingsSectionId = (typeof SETTINGS_NAV_ITEMS)[number]["id"];

export function SettingsHero({
  title = "Settings",
  description = "Manage organization profile, billing, access control, API access, and workspace preferences from one professional settings page.",
  backHref = "/dashboard/org",
  backLabel = "Back to Dashboard",
}: {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/90 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
            <Settings2 className="h-3.5 w-3.5" />
            Organization Settings
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={backHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SettingsOverview({
  data,
  activeMembers,
  activeApiKeys,
}: {
  data: SettingsPageData;
  activeMembers: number;
  activeApiKeys: number;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      <OverviewCard
        label="Organization"
        value={data.organization.name}
        hint={formatLabel(data.organization.status)}
        icon={Building2}
      />
      <OverviewCard
        label="Plan"
        value={formatLabel(data.subscription.plan)}
        hint={`Status: ${formatLabel(data.subscription.status)}`}
        icon={CreditCard}
      />
      <OverviewCard
        label="Active Team Members"
        value={activeMembers}
        hint={`Total members: ${data.members.length}`}
        icon={Users}
      />
      <OverviewCard
        label="Active API Keys"
        value={activeApiKeys}
        hint="External integrations and app access"
        icon={KeyRound}
      />
    </section>
  );
}
