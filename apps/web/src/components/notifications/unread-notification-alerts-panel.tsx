import { headers } from "next/headers";
import {
  getUnreadNotificationAlert,
  type NotificationAlertAudience,
  type UnreadNotificationAlert,
} from "@/lib/notifications/unread-alert";
import { UnreadNotificationAlerts } from "@/components/notifications/unread-notification-alerts";

type UnreadNotificationAlertsPanelProps = {
  audience: NotificationAlertAudience;
  orgId: string;
  userId?: string;
  tenantId?: string;
};

const NOTIFICATIONS_PATHS = new Set([
  "/dashboard/org/notifications",
  "/dashboard/caretaker/notifications",
  "/dashboard/tenant/notifications",
]);

export async function UnreadNotificationAlertsPanel({
  audience,
  orgId,
  userId,
  tenantId,
}: UnreadNotificationAlertsPanelProps) {
  let alert: UnreadNotificationAlert | null = null;
  let skip = false;

  try {
    const headerStore = await headers();
    const pathname = (headerStore.get("x-estatedesk-pathname") ?? "").replace(
      /\/+$/,
      "",
    );

    if (NOTIFICATIONS_PATHS.has(pathname)) {
      skip = true;
    } else {
      alert = await getUnreadNotificationAlert({
        audience,
        orgId,
        userId,
        tenantId,
      });
    }
  } catch (error) {
    // Badge/alerts are non-critical — never fail the whole Server Component tree.
    console.error("[UnreadNotificationAlertsPanel] failed", error);
    return null;
  }

  if (skip || !alert || alert.count <= 0) {
    return null;
  }

  const scope = [audience, orgId, userId ?? "", tenantId ?? ""].join(":");

  return <UnreadNotificationAlerts scope={scope} alert={alert} />;
}
