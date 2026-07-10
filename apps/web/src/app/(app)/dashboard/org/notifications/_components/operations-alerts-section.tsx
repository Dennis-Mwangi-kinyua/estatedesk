import { PushNotificationSettingsPanel } from "@/components/pwa/push-notification-settings-panel";

export function OperationsAlertsSection() {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <p className="text-sm font-semibold text-foreground">Device alerts</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Receive payment, issue, inspection, and workflow alerts on this device.
        </p>
      </div>
      <div className="px-5 py-4 sm:px-6">
        <PushNotificationSettingsPanel />
      </div>
    </section>
  );
}