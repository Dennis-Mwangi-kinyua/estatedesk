import { getPushPublicConfig } from "@/lib/push/web-push";
import { PushNotificationSettings } from "@/components/pwa/push-notification-settings";

export function PushNotificationSettingsPanel({
  variant = "default",
}: {
  variant?: "default" | "theme";
}) {
  return (
    <PushNotificationSettings
      pushConfig={getPushPublicConfig()}
      variant={variant}
    />
  );
}