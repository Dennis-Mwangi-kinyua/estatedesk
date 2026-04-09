import Link from "next/link";

export const dynamic = "force-dynamic";

type Role =
  | "ADMIN"
  | "MANAGER"
  | "OFFICE"
  | "ACCOUNTANT"
  | "CARETAKER";

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED";
};

type ApiKeyItem = {
  id: string;
  name: string;
  lastUsed: string;
  status: "ACTIVE" | "REVOKED";
};

async function getSettingsData() {
  // Replace with Prisma/server query later
  return {
    organization: {
      name: "EstateDesk Properties",
      slug: "estatedesk-properties",
      email: "info@estatedesk.com",
      phone: "+254 700 123 456",
      address: "Westlands, Nairobi, Kenya",
      timezone: "Africa/Nairobi",
      currency: "KES",
      status: "ACTIVE",
    },
    subscription: {
      plan: "PRO",
      status: "ACTIVE",
      billingEmail: "billing@estatedesk.com",
      renewalDate: "2026-04-30",
    },
    preferences: {
      tenantPortal: true,
      issueTracking: true,
      waterBilling: true,
      taxTracking: true,
      smsNotifications: true,
      emailNotifications: true,
    },
    members: [
      {
        id: "1",
        name: "Alice Wanjiku",
        email: "alice@estatedesk.com",
        role: "ADMIN",
        status: "ACTIVE",
      },
      {
        id: "2",
        name: "Brian Otieno",
        email: "brian@estatedesk.com",
        role: "MANAGER",
        status: "ACTIVE",
      },
      {
        id: "3",
        name: "Carol Njeri",
        email: "carol@estatedesk.com",
        role: "ACCOUNTANT",
        status: "ACTIVE",
      },
      {
        id: "4",
        name: "David Kimani",
        email: "david@estatedesk.com",
        role: "CARETAKER",
        status: "SUSPENDED",
      },
    ] satisfies Member[],
    apiKeys: [
      {
        id: "1",
        name: "Mobile App Key",
        lastUsed: "2026-04-05 14:21",
        status: "ACTIVE",
      },
      {
        id: "2",
        name: "Accounting Integration",
        lastUsed: "2026-04-03 09:12",
        status: "ACTIVE",
      },
      {
        id: "3",
        name: "Legacy API Key",
        lastUsed: "2026-03-11 10:48",
        status: "REVOKED",
      },
    ] satisfies ApiKeyItem[],
    integrations: [
      { name: "M-Pesa", status: "Connected" },
      { name: "Email Provider", status: "Connected" },
      { name: "SMS Gateway", status: "Not Connected" },
      { name: "Webhooks", status: "Connected" },
    ],
  };
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-background shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
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
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
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
      <span className="text-sm font-medium">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
}: {
  label: string;
  description?: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <button
        type="button"
        aria-pressed={enabled}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
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
    default: "border bg-background text-foreground",
    success: "border-green-200 bg-green-50 text-green-700",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    muted: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[variant]}`}
    >
      {label}
    </span>
  );
}

export default async function SettingsPage() {
  const data = await getSettingsData();

  const activeMembers = data.members.filter(
    (member) => member.status === "ACTIVE"
  ).length;

  const activeApiKeys = data.apiKeys.filter(
    (key) => key.status === "ACTIVE"
  ).length;

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage organization, billing, access control, integrations, and app
            preferences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/org"
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Back to Dashboard
          </Link>
          <button className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Save Changes
          </button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Organization</p>
          <p className="mt-2 text-xl font-semibold">{data.organization.name}</p>
          <div className="mt-3">
            <StatusBadge label={data.organization.status} variant="success" />
          </div>
        </div>

        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Plan</p>
          <p className="mt-2 text-xl font-semibold">{data.subscription.plan}</p>
          <div className="mt-3">
            <StatusBadge label={data.subscription.status} variant="success" />
          </div>
        </div>

        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Team Members</p>
          <p className="mt-2 text-xl font-semibold">{activeMembers}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Total members: {data.members.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-background p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">API Keys</p>
          <p className="mt-2 text-xl font-semibold">{activeApiKeys}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            External integrations and app access
          </p>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-3">
        <div className="space-y-6 2xl:col-span-2">
          <SectionCard
            title="Organization Profile"
            description="Update company profile, core organization details, and regional settings."
          >
            <form className="grid gap-4 md:grid-cols-2">
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
              />
              <InputField
                label="Phone Number"
                name="phone"
                defaultValue={data.organization.phone}
              />
              <div className="md:col-span-2">
                <InputField
                  label="Address"
                  name="address"
                  defaultValue={data.organization.address}
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
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Update Organization
                </button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Organization Preferences"
            description="Control modules and system-level behavior for your workspace."
          >
            <div className="grid gap-3">
              <ToggleRow
                label="Tenant Portal"
                description="Allow tenants to access balances, notices, and lease-related information."
                enabled={data.preferences.tenantPortal}
              />
              <ToggleRow
                label="Issue Tracking"
                description="Enable maintenance, complaints, and internal issue workflows."
                enabled={data.preferences.issueTracking}
              />
              <ToggleRow
                label="Water Billing"
                description="Enable meter readings, billing, and water invoice workflows."
                enabled={data.preferences.waterBilling}
              />
              <ToggleRow
                label="Tax Tracking"
                description="Enable tax-related charges, tracking, and reporting."
                enabled={data.preferences.taxTracking}
              />
              <ToggleRow
                label="SMS Notifications"
                description="Allow outgoing SMS reminders and alerts."
                enabled={data.preferences.smsNotifications}
              />
              <ToggleRow
                label="Email Notifications"
                description="Allow outgoing email reminders and alerts."
                enabled={data.preferences.emailNotifications}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Users & Access"
            description="Manage staff roles, organization access, and account status."
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                type="text"
                placeholder="Search members..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm md:max-w-sm"
              />
              <div className="flex items-center gap-2">
                <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
                  Export
                </button>
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Invite Member
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.members.map((member) => (
                    <tr key={member.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-medium">{member.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {member.email}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={member.role} variant="default" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={member.status}
                          variant={
                            member.status === "ACTIVE" ? "success" : "warning"
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Billing & Subscription"
            description="Configure subscriptions, billing contacts, and renewal settings."
          >
            <div className="space-y-4">
              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <p className="mt-1 text-lg font-semibold">
                      {data.subscription.plan}
                    </p>
                  </div>
                  <StatusBadge
                    label={data.subscription.status}
                    variant="success"
                  />
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>
                    Billing email:{" "}
                    <span className="font-medium text-foreground">
                      {data.subscription.billingEmail}
                    </span>
                  </p>
                  <p>
                    Renewal date:{" "}
                    <span className="font-medium text-foreground">
                      {data.subscription.renewalDate}
                    </span>
                  </p>
                </div>
              </div>

              <form className="space-y-4">
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
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Update Billing
                </button>
              </form>
            </div>
          </SectionCard>

          <SectionCard
            title="Integrations"
            description="Manage external services and platform connections."
          >
            <div className="space-y-3">
              {data.integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <div>
                    <p className="text-sm font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Service connection status
                    </p>
                  </div>
                  <StatusBadge
                    label={integration.status}
                    variant={
                      integration.status === "Connected" ? "success" : "muted"
                    }
                  />
                </div>
              ))}

              <button className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
                Manage Integrations
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="API Keys"
            description="Manage application access and partner integrations."
          >
            <div className="space-y-3">
              {data.apiKeys.map((key) => (
                <div key={key.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{key.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last used: {key.lastUsed}
                      </p>
                    </div>
                    <StatusBadge
                      label={key.status}
                      variant={key.status === "ACTIVE" ? "success" : "danger"}
                    />
                  </div>
                </div>
              ))}

              <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                Create API Key
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Danger Zone"
            description="Sensitive account and organization actions."
          >
            <div className="space-y-3">
              <button className="w-full rounded-md border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:opacity-90">
                Suspend Organization
              </button>
              <button className="w-full rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:opacity-90">
                Disable Organization
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}