import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Download,
  FileArchive,
  Globe2,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import { AppearanceSettings } from "@/components/theme/appearance-settings";
import { CurrencySelect } from "@/components/forms/currency-select";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { formatLabel, getSettingsPageData } from "./settings-data";
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

import {
  EmptyState,
  InfoRow,
  InputField,
  MemberMobileCard,
  SectionCard,
  SelectField,
  SettingsHero,
  SettingsOverview,
  SmallInfoCard,
  StatusBadge,
  TextAreaField,
  ToggleField,
  SETTINGS_NAV_ITEMS,
} from "./settings-ui";
import type { SettingsSectionId } from "./settings-ui";

export { SETTINGS_NAV_ITEMS } from "./settings-ui";
export type { SettingsSectionId } from "./settings-ui";

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
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Currency
                <CurrencySelect
                  name="currency"
                  defaultValue={data.organization.currency}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-400"
                />
              </label>

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
