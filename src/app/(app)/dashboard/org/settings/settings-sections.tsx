import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Prisma, type OrgRole, type UserStatus } from "@prisma/client";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  CreditCard,
  Download,
  FileArchive,
  Globe2,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Plus,
  Settings2,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import { AppearanceSettings } from "@/components/theme/appearance-settings";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import {
  type PaymentInstructions,
  parsePaymentInstructions,
} from "@/lib/payments/instructions";
import {
  createApiKeyAction,
  inviteMemberAction,
  requestDataExportAction,
  toggleApiKeyStatusAction,
  updateBillingAction,
  updateOrganizationAction,
  updatePaymentInstructionsAction,
  updatePreferencesAction,
} from "@/features/settings/actions/settings-actions";

export const dynamic = "force-dynamic";

type Member = {
  id: string;
  name: string;
  email: string;
  role: OrgRole;
  status: UserStatus;
};

type ApiKeyItem = {
  id: string;
  name: string;
  lastUsed: string;
  status: "ACTIVE" | "REVOKED";
};

type DataExportRequestItem = {
  id: string;
  status: string;
  reason: string;
  reviewerNotes: string;
  requestedAt: string;
  reviewedAt: string;
  expiresAt: string;
  requestedBy: string;
  reviewedBy: string;
};

type SettingsPageData = {
  organization: {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone: string;
    address: string;
    timezone: string;
    currency: string;
    status: "ACTIVE" | "SUSPENDED" | "DISABLED";
  };
  subscription: {
    plan: "FREE" | "PRO" | "PLUS" | "ENTERPRISE";
    status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
    billingEmail: string;
    renewalDate: string;
  };
  preferences: {
    tenantPortal: boolean;
    issueTracking: boolean;
    waterBilling: boolean;
    taxTracking: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
  };
  paymentInstructions: PaymentInstructions;
  members: Member[];
  apiKeys: ApiKeyItem[];
  dataExportRequests: DataExportRequestItem[];
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function asObject(
  value: Prisma.JsonValue | null | undefined,
): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Prisma.JsonValue>;
}

function getBoolean(
  source: Prisma.JsonValue | null | undefined,
  key: string,
  fallback = false,
) {
  const obj = asObject(source);
  return typeof obj[key] === "boolean" ? (obj[key] as boolean) : fallback;
}

async function getSettingsPageData(orgId: string): Promise<SettingsPageData> {
  const org = await retryTransientDatabaseOperation(
    () =>
      prisma.organization.findFirstOrThrow({
        where: {
          id: orgId,
          deletedAt: null,
        },
        include: {
          settings: true,
          subscription: true,
          memberships: {
            where: {
              user: {
                deletedAt: null,
              },
            },
            include: {
              user: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          apiKeys: {
            orderBy: {
              createdAt: "desc",
            },
          },
          dataExportRequests: {
            orderBy: {
              requestedAt: "desc",
            },
            take: 8,
            include: {
              requestedBy: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
              reviewedBy: {
                select: {
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
    { label: "getSettingsPageData-find-organization" },
  );

  const features = org.settings?.features;
  const notificationDefaults = org.settings?.notificationDefaults;
  const paymentInstructions = parsePaymentInstructions(
    org.settings?.customFields,
  );

  return {
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email ?? "",
      phone: org.phone ?? "",
      address: org.address ?? "",
      timezone: org.timezone,
      currency: org.currencyCode,
      status: org.status,
    },
    subscription: {
      plan: org.subscription?.plan ?? "FREE",
      status: org.subscription?.status ?? "ACTIVE",
      billingEmail: org.subscription?.billingEmail ?? org.email ?? "",
      renewalDate: formatDate(org.subscription?.currentPeriodEnd),
    },
    preferences: {
      tenantPortal: getBoolean(features, "tenantPortal"),
      issueTracking: getBoolean(features, "issueTracking"),
      waterBilling: getBoolean(features, "waterBilling"),
      taxTracking: getBoolean(features, "taxTracking"),
      smsNotifications: getBoolean(notificationDefaults, "smsNotifications"),
      emailNotifications: getBoolean(notificationDefaults, "emailNotifications"),
    },
    paymentInstructions,
    members: org.memberships.map((membership) => ({
      id: membership.id,
      name: membership.user.fullName,
      email: membership.user.email ?? membership.user.phone ?? "—",
      role: membership.role,
      status: membership.user.status,
    })),
    apiKeys: org.apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      lastUsed: formatDateTime(key.lastUsedAt),
      status: key.isActive ? "ACTIVE" : "REVOKED",
    })),
    dataExportRequests: org.dataExportRequests.map((request) => ({
      id: request.id,
      status: request.status,
      reason: request.reason ?? "",
      reviewerNotes: request.reviewerNotes ?? "",
      requestedAt: formatDateTime(request.requestedAt),
      reviewedAt: formatDateTime(request.reviewedAt),
      expiresAt: formatDateTime(request.expiresAt),
      requestedBy:
        request.requestedBy.fullName ??
        request.requestedBy.email ??
        "Workspace user",
      reviewedBy:
        request.reviewedBy?.fullName ??
        request.reviewedBy?.email ??
        "Not reviewed",
    })),
  };
}

function SectionCard({
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

function OverviewCard({
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

function InputField({
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

function TextAreaField({
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

function SelectField({
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

function ToggleField({
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

function StatusBadge({
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

function InfoRow({
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

function EmptyState({
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

function MemberMobileCard({ member }: { member: Member }) {
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

function SmallInfoCard({
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

function SettingsHero({
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

function SettingsOverview({
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

export async function SettingsHomePage() {
  const orgId = await requireCurrentOrgId();
  const data = await getSettingsPageData(orgId);

  const activeMembers = data.members.filter(
    (member) => member.status === "ACTIVE",
  ).length;

  const activeApiKeys = data.apiKeys.filter(
    (key) => key.status === "ACTIVE",
  ).length;

  return (
    <div className="space-y-4 pb-8 sm:space-y-6">
      <SettingsHero />
      <SettingsOverview
        data={data}
        activeMembers={activeMembers}
        activeApiKeys={activeApiKeys}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SETTINGS_NAV_ITEMS.map((item) => {
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group flex min-h-32 items-start rounded-2xl border border-slate-200 !bg-white p-5 !text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:!bg-white hover:shadow-md dark:border-white/10 dark:!bg-slate-900 dark:!text-white dark:hover:border-white/20"
            >
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold !text-slate-950 dark:!text-white">
                  {item.label}
                </span>
                <span className="mt-2 block text-sm leading-6 !text-slate-500 dark:!text-slate-300">
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

export async function SettingsSectionPage({
  sectionId,
}: {
  sectionId: SettingsSectionId;
}) {
  const orgId = await requireCurrentOrgId();
  const data = await getSettingsPageData(orgId);

  const activeMembers = data.members.filter(
    (member) => member.status === "ACTIVE",
  ).length;

  const activeApiKeys = data.apiKeys.filter(
    (key) => key.status === "ACTIVE",
  ).length;

  const currentSection = SETTINGS_NAV_ITEMS.find((item) => item.id === sectionId);

  return (
    <div className="space-y-4 pb-8 sm:space-y-6">
      <SettingsHero
        title={currentSection?.label ?? "Settings"}
        description={currentSection?.description}
        backHref="/dashboard/org/settings"
        backLabel="Settings Home"
      />

      <SettingsOverview
        data={data}
        activeMembers={activeMembers}
        activeApiKeys={activeApiKeys}
      />

      <div className="grid gap-4 lg:gap-6">
        <div className="space-y-4 sm:space-y-6">
          <SectionCard
            id="organization-profile"
            hidden={sectionId !== "organization-profile"}
            title="Organization Profile"
            description="Update your company profile, contact information, and regional defaults."
            action={
              <StatusBadge
                label={formatLabel(data.organization.status)}
                variant={
                  data.organization.status === "ACTIVE"
                    ? "success"
                    : data.organization.status === "SUSPENDED"
                      ? "warning"
                      : "danger"
                }
              />
            }
          >
            <form
              action={updateOrganizationAction}
              className="grid gap-4 md:grid-cols-2"
            >
              <InputField
                label="Organization Name"
                name="organizationName"
                defaultValue={data.organization.name}
              />
              <InputField
                label="Slug"
                name="slug"
                defaultValue={data.organization.slug}
              />
              <InputField
                label="Email Address"
                name="email"
                type="email"
                defaultValue={data.organization.email}
                placeholder="company@example.com"
              />
              <InputField
                label="Phone Number"
                name="phone"
                defaultValue={data.organization.phone}
                placeholder="+254 700 000 000"
              />
              <div className="md:col-span-2">
                <InputField
                  label="Address"
                  name="address"
                  defaultValue={data.organization.address}
                  placeholder="Westlands, Nairobi, Kenya"
                />
              </div>
              <InputField
                label="Timezone"
                name="timezone"
                defaultValue={data.organization.timezone}
              />
              <InputField
                label="Currency"
                name="currency"
                defaultValue={data.organization.currency}
              />

              <div className="flex justify-end md:col-span-2">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Update Organization
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            id="workspace-preferences"
            hidden={sectionId !== "workspace-preferences"}
            title="Workspace Preferences"
            description="Control modules and default notification behavior for your organization."
          >
            <AppearanceSettings />

            <form action={updatePreferencesAction} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleField
                  label="Tenant Portal"
                  description="Allow tenants to access balances, lease-related information, and notices."
                  name="tenantPortal"
                  defaultChecked={data.preferences.tenantPortal}
                />
                <ToggleField
                  label="Issue Tracking"
                  description="Enable maintenance tickets, complaints, and internal issue workflows."
                  name="issueTracking"
                  defaultChecked={data.preferences.issueTracking}
                />
                <ToggleField
                  label="Water Billing"
                  description="Enable water meter readings, billing, and invoice workflows."
                  name="waterBilling"
                  defaultChecked={data.preferences.waterBilling}
                />
                <ToggleField
                  label="Tax Tracking"
                  description="Enable tax-related charges, tracking, and reporting."
                  name="taxTracking"
                  defaultChecked={data.preferences.taxTracking}
                />
                <ToggleField
                  label="SMS Notifications"
                  description="Allow outgoing SMS alerts and payment reminders."
                  name="smsNotifications"
                  defaultChecked={data.preferences.smsNotifications}
                />
                <ToggleField
                  label="Email Notifications"
                  description="Allow outgoing email notifications and system reminders."
                  name="emailNotifications"
                  defaultChecked={data.preferences.emailNotifications}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  Update Preferences
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            id="payment-instructions"
            hidden={sectionId !== "payment-instructions"}
            title="Payment Instructions"
            description="Set the M-Pesa and bank details tenants should use for this organization. These details are shown during checkout."
            action={
              <StatusBadge
                label={
                  data.paymentInstructions.mpesaEnabled ||
                  data.paymentInstructions.bankEnabled
                    ? "Configured"
                    : "Not configured"
                }
                variant={
                  data.paymentInstructions.mpesaEnabled ||
                  data.paymentInstructions.bankEnabled
                    ? "success"
                    : "warning"
                }
              />
            }
          >
            <form action={updatePaymentInstructionsAction} className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-slate-900/50 sm:p-4">
                <ToggleField
                  label="Enable M-Pesa Instructions"
                  description="Show this organization's Paybill or Till details to tenants during checkout."
                  name="mpesaEnabled"
                  defaultChecked={data.paymentInstructions.mpesaEnabled}
                />

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Business Name"
                    name="mpesaBusinessName"
                    defaultValue={data.paymentInstructions.mpesaBusinessName}
                    placeholder="EstateDesk Properties Ltd"
                  />
                  <InputField
                    label="Paybill Number"
                    name="mpesaPaybill"
                    defaultValue={data.paymentInstructions.mpesaPaybill}
                    placeholder="123456"
                  />
                  <InputField
                    label="Till Number"
                    name="mpesaTillNumber"
                    defaultValue={data.paymentInstructions.mpesaTillNumber}
                    placeholder="987654"
                  />
                  <InputField
                    label="Default Account Reference"
                    name="mpesaAccountNumber"
                    defaultValue={data.paymentInstructions.mpesaAccountNumber}
                    placeholder="Use your house number or tenant code"
                  />
                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Tenant Instructions"
                      name="mpesaInstructions"
                      defaultValue={data.paymentInstructions.mpesaInstructions}
                      placeholder="Example: Go to M-Pesa, Lipa na M-Pesa, Paybill, enter account as your unit number, then submit the confirmation code in EstateDesk."
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-slate-900/50 sm:p-4">
                <ToggleField
                  label="Enable Bank Instructions"
                  description="Show this organization's bank account details to tenants during checkout."
                  name="bankEnabled"
                  defaultChecked={data.paymentInstructions.bankEnabled}
                />

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Bank Name"
                    name="bankName"
                    defaultValue={data.paymentInstructions.bankName}
                    placeholder="KCB Bank Kenya"
                  />
                  <InputField
                    label="Account Name"
                    name="bankAccountName"
                    defaultValue={data.paymentInstructions.bankAccountName}
                    placeholder="EstateDesk Properties Ltd"
                  />
                  <InputField
                    label="Account Number"
                    name="bankAccountNumber"
                    defaultValue={data.paymentInstructions.bankAccountNumber}
                    placeholder="1234567890"
                  />
                  <InputField
                    label="Branch"
                    name="bankBranch"
                    defaultValue={data.paymentInstructions.bankBranch}
                    placeholder="Westlands"
                  />
                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Tenant Instructions"
                      name="bankInstructions"
                      defaultValue={data.paymentInstructions.bankInstructions}
                      placeholder="Example: Transfer exact amount, use your unit number as reference, then submit the bank confirmation reference in EstateDesk."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                >
                  Save Payment Instructions
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            id="users-access"
            hidden={sectionId !== "users-access"}
            title="Users & Access"
            description="Manage member roles, organization access, and invitations."
            action={
              <div className="text-sm text-slate-500">
                {activeMembers} active of {data.members.length} members
              </div>
            }
          >
            <form
              action={inviteMemberAction}
              className="mb-5 grid gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_180px_auto]"
            >
              <input
                type="email"
                name="email"
                placeholder="member@example.com"
                required
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />

              <select
                name="role"
                defaultValue="MANAGER"
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              >
                <option value="LANDLORD">Landlord</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="OFFICE">Office</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="CARETAKER">Caretaker</option>
              </select>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Invite Member
              </button>
            </form>

            {data.members.length === 0 ? (
              <EmptyState
                title="No members yet"
                description="Invite your team to start assigning roles and organization access."
              />
            ) : (
              <>
                <div className="grid gap-3 lg:hidden">
                  {data.members.map((member) => (
                    <MemberMobileCard key={member.id} member={member} />
                  ))}
                </div>

                <div className="hidden rounded-[20px] border border-slate-200 lg:block">
                  <table className="w-full table-fixed text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Member
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.members.map((member) => (
                        <tr
                          key={member.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-950">
                                {member.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Workspace member
                              </p>
                            </div>
                          </td>

                          <td className="break-all px-4 py-3 text-slate-600">
                            {member.email}
                          </td>

                          <td className="px-4 py-3">
                            <StatusBadge
                              label={formatLabel(member.role)}
                              variant="default"
                            />
                          </td>

                          <td className="px-4 py-3">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard
            id="api-keys"
            hidden={sectionId !== "api-keys"}
            title="API Keys"
            description="Create, review, and revoke application credentials."
          >
            <form
              action={createApiKeyAction}
              className="mb-5 grid gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_180px_auto]"
            >
              <input
                type="text"
                name="name"
                placeholder="Accounting Integration"
                required
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />

              <input
                type="date"
                name="expiresAt"
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create API Key
              </button>
            </form>

            {data.apiKeys.length === 0 ? (
              <EmptyState
                title="No API keys yet"
                description="Create your first API key when you are ready to connect external apps or services."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.apiKeys.map((key) => {
                  const isActive = key.status === "ACTIVE";

                  return (
                    <div
                      key={key.id}
                      className="rounded-[20px] border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {key.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Last used: {key.lastUsed}
                          </p>
                        </div>

                        <StatusBadge
                          label={formatLabel(key.status)}
                          variant={isActive ? "success" : "danger"}
                        />
                      </div>

                      <form
                        action={toggleApiKeyStatusAction}
                        className="mt-4 flex justify-end"
                      >
                        <input type="hidden" name="apiKeyId" value={key.id} />
                        <input
                          type="hidden"
                          name="nextActive"
                          value={isActive ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {isActive ? "Revoke Key" : "Activate Key"}
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <SectionCard
            id="organization-summary"
            hidden={sectionId !== "organization-summary"}
            title="Organization Summary"
            description="A quick overview of your workspace profile and status."
          >
            <div className="space-y-1 divide-y divide-slate-100">
              <InfoRow
                label="Organization Name"
                value={data.organization.name}
              />
              <InfoRow label="Slug" value={data.organization.slug} />
              <InfoRow
                label="Status"
                value={formatLabel(data.organization.status)}
              />
              <InfoRow label="Timezone" value={data.organization.timezone} />
              <InfoRow label="Currency" value={data.organization.currency} />
            </div>
          </SectionCard>

          <SectionCard
            id="billing"
            hidden={sectionId !== "billing"}
            title="Billing & Subscription"
            description="Current plan details and billing contact information."
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Current Plan</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">
                    {formatLabel(data.subscription.plan)}
                  </p>
                </div>

                <StatusBadge
                  label={formatLabel(data.subscription.status)}
                  variant={
                    data.subscription.status === "ACTIVE"
                      ? "success"
                      : data.subscription.status === "PAST_DUE"
                        ? "warning"
                        : "muted"
                  }
                />
              </div>

              <div className="mt-4 space-y-1 divide-y divide-slate-200">
                <InfoRow
                  label="Billing Email"
                  value={data.subscription.billingEmail || "—"}
                />
                <InfoRow
                  label="Renewal Date"
                  value={data.subscription.renewalDate}
                />
              </div>
            </div>

            <form action={updateBillingAction} className="mt-4 space-y-4">
              <InputField
                label="Billing Email"
                name="billingEmail"
                type="email"
                defaultValue={data.subscription.billingEmail}
              />
              <SelectField
                label="Subscription Plan"
                name="subscriptionPlan"
                defaultValue={data.subscription.plan}
                options={["FREE", "PRO", "PLUS", "ENTERPRISE"]}
              />

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Update Billing
              </button>
            </form>
          </SectionCard>

          <SectionCard
            id="contact-region"
            hidden={sectionId !== "contact-region"}
            title="Contact & Region"
            description="Primary business contact details for this organization."
          >
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
              <SmallInfoCard
                icon={Mail}
                title="Email"
                value={data.organization.email || "Not set"}
              />
              <SmallInfoCard
                icon={Phone}
                title="Phone"
                value={data.organization.phone || "Not set"}
              />
              <SmallInfoCard
                icon={MapPin}
                title="Address"
                value={data.organization.address || "Not set"}
              />
              <SmallInfoCard
                icon={Globe2}
                title="Timezone"
                value={data.organization.timezone}
              />
            </div>
          </SectionCard>

          <SectionCard
            id="security-access"
            hidden={sectionId !== "security-access"}
            title="Security & Access"
            description="A quick administrative view of workspace access."
          >
            <div className="grid gap-3">
              <SmallInfoCard
                icon={ShieldCheck}
                title="Member Access"
                value={
                  <>
                    {activeMembers} active member
                    {activeMembers === 1 ? "" : "s"} currently have access to
                    this organization.
                  </>
                }
              />
              <SmallInfoCard
                icon={BadgeCheck}
                title="API Credentials"
                value={
                  <>
                    {activeApiKeys} active API key
                    {activeApiKeys === 1 ? "" : "s"} available for
                    integrations and external services.
                  </>
                }
              />
              <SmallInfoCard
                icon={CalendarDays}
                title="Subscription Renewal"
                value={
                  <>
                    Next renewal is scheduled for{" "}
                    <span className="font-medium text-slate-900">
                      {data.subscription.renewalDate}
                    </span>
                    .
                  </>
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            id="data-export"
            hidden={sectionId !== "data-export"}
            title="Data Export"
            description="Request a platform-reviewed CSV archive of your organization data."
          >
            <form action={requestDataExportAction} className="space-y-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Request reason
                </span>
                <textarea
                  name="reason"
                  rows={3}
                  placeholder="Audit, migration, compliance review..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
              </label>

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <FileArchive className="h-4 w-4" />
                Request CSV Export
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {data.dataExportRequests.length === 0 ? (
                <EmptyState
                  title="No export requests"
                  description="Approved requests will appear here with a download link."
                />
              ) : (
                data.dataExportRequests.map((request) => {
                  const isApproved = request.status === "APPROVED";
                  const variant =
                    request.status === "APPROVED"
                      ? "success"
                      : request.status === "REJECTED"
                        ? "danger"
                        : "warning";

                  return (
                    <div
                      key={request.id}
                      className="rounded-[18px] border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-950">
                            Requested {request.requestedAt}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            By {request.requestedBy}
                          </p>
                        </div>
                        <StatusBadge
                          label={formatLabel(request.status)}
                          variant={variant}
                        />
                      </div>

                      {request.reason ? (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {request.reason}
                        </p>
                      ) : null}

                      {request.reviewerNotes ? (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Platform note: {request.reviewerNotes}
                        </p>
                      ) : null}

                      {isApproved ? (
                        <Link
                          href={`/api/data-exports/${request.id}/download`}
                          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Download className="h-4 w-4" />
                          Download ZIP
                        </Link>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </SectionCard>

          <SectionCard
            id="danger-zone"
            hidden
            title="Danger Zone"
            description="Sensitive organization-level actions. Leave these disabled until you define the exact policy."
          >
            <div className="space-y-3">
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-between rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-left opacity-60 dark:border-white/10 dark:bg-slate-900"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Suspend Organization
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Add a dedicated admin-only action before enabling this.
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </button>

              <button
                type="button"
                disabled
                className="flex w-full items-center justify-between rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-left opacity-60 dark:border-white/10 dark:bg-slate-900"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Disable Organization
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Add a dedicated admin-only action before enabling this.
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </SectionCard>

          <SectionCard
            id="developer-notes"
            hidden
            title="Developer Notes"
            description="This version reads and writes real data."
          >
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
                <Building2 className="mt-0.5 h-4 w-4 text-slate-500" />
                <p>Organization profile saves to the organization table.</p>
              </div>

              <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
                <Wallet className="mt-0.5 h-4 w-4 text-slate-500" />
                <p>Billing updates save to the subscription record.</p>
              </div>

              <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
                <Users className="mt-0.5 h-4 w-4 text-slate-500" />
                <p>Invitations create real invitation rows in the database.</p>
              </div>

              <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
                <KeyRound className="mt-0.5 h-4 w-4 text-slate-500" />
                <p>
                  API keys are created hashed in the database and can be revoked
                  or reactivated.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
