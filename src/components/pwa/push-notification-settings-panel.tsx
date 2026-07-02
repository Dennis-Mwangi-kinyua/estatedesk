import { getPushPublicConfig } from "@/lib/push/web-push";
import { PushNotificationSettings } from "@/components/pwa/push-notification-settings";

export function PushNotificationSettingsPanel() {
  return <PushNotificationSettings pushConfig={getPushPublicConfig()} />;
}