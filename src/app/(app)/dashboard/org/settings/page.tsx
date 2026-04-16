import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Prisma } from "@prisma/client";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  CreditCard,
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

import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import {
  createApiKeyAction,
  inviteMemberAction,
  toggleApiKeyStatusAction,
  updateBillingAction,
  updateOrganizationAction,
  updatePreferencesAction,
} from "@/features/settings/actions/settings-actions";

export const dynamic = "force-dynamic";

type Role =
  | "ADMIN"
  | "MANAGER"
  | "OFFICE"
  | "ACCOUNTANT"
  | "CARETAKER"
  | "TENANT";

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED" | "DISABLED";
};

type ApiKeyItem = {
  id: string;
  name: string;
  lastUsed: string;
  status: "ACTIVE" | "REVOKED";
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
  members: Member[];
  apiKeys: ApiKeyItem[];
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
  const org = await prisma.organization.findFirstOrThrow({
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
    },
  });

  const features = org.settings?.features;
  const notificationDefaults = org.settings?.notificationDefaults;

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
  };
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div>{action}</div> : null}
      </div>

      <div className="p-5">{children}</div>
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
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
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
    <label className="space-y-2">
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
    <label className="space-y-2">
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
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-[20px] border border-slate-200 p-4">
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
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
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
    <div className="flex items-start justify-between gap-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">
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
    <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export default async function SettingsPage() {
  const orgId = await requireCurrentOrgId();
  const data = await getSettingsPageData(orgId);

  const activeMembers = data.members.filter(
    (member) => member.status === "ACTIVE",
  ).length;

  const activeApiKeys = data.apiKeys.filter(
    (key) => key.status === "ACTIVE",
  ).length;

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <Settings2 className="h-3.5 w-3.5" />
              Organization Settings
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Settings
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Manage organization profile, billing, access control, API access,
              and workspace preferences from one professional settings page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/org"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.9fr)]">
        <div className="space-y-6">
          <SectionCard
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

              <div className="md:col-span-2 flex justify-end">
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
            title="Workspace Preferences"
            description="Control modules and default notification behavior for your organization."
          >
            <form action={updatePreferencesAction} className="space-y-3">
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

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Update Preferences
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
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
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="OFFICE">Office</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="CARETAKER">Caretaker</option>
                <option value="TENANT">Tenant</option>
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
              <div className="overflow-x-auto rounded-[20px] border border-slate-200">
                <table className="min-w-full text-sm">
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

                        <td className="px-4 py-3 text-slate-600">
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
            )}
          </SectionCard>

          <SectionCard
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

        <div className="space-y-6">
          <SectionCard
            title="Organization Summary"
            description="A quick overview of your workspace profile and status."
          >
            <div className="space-y-1 divide-y divide-slate-100">
              <InfoRow label="Organization Name" value={data.organization.name} />
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
            title="Billing & Subscription"
            description="Current plan details and billing contact information."
          >
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
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
            title="Contact & Region"
            description="Primary business contact details for this organization."
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
                <Mail className="mt-0.5 h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email</p>
                  <p className="text-sm text-slate-500">
                    {data.organization.email || "Not set"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
                <Phone className="mt-0.5 h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Phone</p>
                  <p className="text-sm text-slate-500">
                    {data.organization.phone || "Not set"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Address</p>
                  <p className="text-sm text-slate-500">
                    {data.organization.address || "Not set"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[18px] border border-slate-200 p-4">
                <Globe2 className="mt-0.5 h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Timezone</p>
                  <p className="text-sm text-slate-500">
                    {data.organization.timezone}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Security & Access"
            description="A quick administrative view of workspace access."
          >
            <div className="space-y-3">
              <div className="rounded-[18px] border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-slate-700" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Member Access
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {activeMembers} active member
                      {activeMembers === 1 ? "" : "s"} currently have access to
                      this organization.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 text-slate-700" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      API Credentials
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {activeApiKeys} active API key
                      {activeApiKeys === 1 ? "" : "s"} available for integrations
                      and external services.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 text-slate-700" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Subscription Renewal
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Next renewal is scheduled for{" "}
                      <span className="font-medium text-slate-900">
                        {data.subscription.renewalDate}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Danger Zone"
            description="Sensitive organization-level actions. Leave these disabled until you define the exact policy."
          >
            <div className="space-y-3">
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-between rounded-[18px] border border-amber-300 bg-amber-50 px-4 py-3 text-left opacity-60"
              >
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Suspend Organization
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Add a dedicated admin-only action before enabling this.
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-amber-700" />
              </button>

              <button
                type="button"
                disabled
                className="flex w-full items-center justify-between rounded-[18px] border border-red-300 bg-red-50 px-4 py-3 text-left opacity-60"
              >
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Disable Organization
                  </p>
                  <p className="mt-1 text-xs text-red-700">
                    Add a dedicated admin-only action before enabling this.
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-red-700" />
              </button>
            </div>
          </SectionCard>

          <SectionCard
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
                <p>API keys are created hashed in the database and can be revoked or reactivated.</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}