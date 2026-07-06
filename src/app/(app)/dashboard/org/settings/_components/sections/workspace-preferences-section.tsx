import { AppearanceSettings } from "@/components/theme/appearance-settings";
import { PushNotificationSettingsPanel } from "@/components/pwa/push-notification-settings-panel";
import { updatePreferencesAction } from "@/features/settings/actions/settings-actions";
import type { SettingsPageData } from "../../settings-data";
import { SectionCard, ToggleField } from "../../settings-ui";

export function WorkspacePreferencesSection({ data }: { data: SettingsPageData }) {
  return (
    <SectionCard
      id="workspace-preferences"
      title="Workspace Preferences"
      description="Control modules and default notification behavior for your organization."
    >
      <AppearanceSettings />

      <div className="mt-4">
        <PushNotificationSettingsPanel />
      </div>

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
  );
}