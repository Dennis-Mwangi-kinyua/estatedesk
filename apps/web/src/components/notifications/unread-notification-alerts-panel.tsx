import { getUnreadAlertPayload } from "@/lib/notifications/unread-alert";
import { UnreadNotificationAlerts } from "./unread-notification-alerts";

type UnreadNotificationAlertsPanelProps = {
  audience: "org" | "tenant" | "caretaker" | "landlord" | "platform";
  orgId: string;
  userId?: string | null;
  tenantId?: string | null;
};

export async function UnreadNotificationAlertsPanel({
  audience,
  orgId,
  userId,
  tenantId,
}: UnreadNotificationAlertsPanelProps) {
  let alert: Awaited<ReturnType<typeof getUnreadAlertPayload>> | null = null;

  try {
    alert = await getUnreadAlertPayload({
      audience,
      orgId,
      userId,
      tenantId,
    });
  } catch (error) {
    // Badge/alerts are non-critical — never fail the whole Server Component tree.
    console.error("[UnreadNotificationAlertsPanel] failed", error);
    return null;
  }

  if (!alert || alert.count <= 0) {
    return null;
  }

  const scope = [audience, orgId, userId ?? "", tenantId ?? ""].join(":");

  return <UnreadNotificationAlerts scope={scope} alert={alert} />;
}
