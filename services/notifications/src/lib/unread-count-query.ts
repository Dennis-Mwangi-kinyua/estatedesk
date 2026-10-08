import {
  NotificationChannel,
  NotificationStatus,
  type OrgRole,
} from "@prisma/client";
import { personalNotificationScope } from "../../../../apps/web/src/lib/notifications/recipient-scope";

export function buildPersonalUnreadNotificationWhere(input: {
  orgId: string;
  userId: string;
  orgRole: OrgRole | null;
  tenantId?: string | null;
}) {
  const base = {
    orgId: input.orgId,
    channel: NotificationChannel.IN_APP,
    status: NotificationStatus.SENT,
    readAt: null,
  };

  if (input.orgRole === "TENANT" && input.tenantId) {
    return {
      ...base,
      ...personalNotificationScope(input),
    };
  }

  return {
    ...base,
    ...personalNotificationScope({ userId: input.userId }),
  };
}
