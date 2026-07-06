import { PushNotificationSettingsPanel } from "@/components/pwa/push-notification-settings-panel";
import { panelShellClassName } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";

export function ProfileAlertsSection() {
  return (
    <section className={panelShellClassName}>
      <PushNotificationSettingsPanel variant="theme" />
    </section>
  );
}