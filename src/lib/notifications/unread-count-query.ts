import {
  NotificationChannel,
  NotificationStatus,
  type OrgRole,
} from "@prisma/client";

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
      OR: [{ tenantId: input.tenantId }, { userId: input.userId }],
    };
  }

  return {
    ...base,
    userId: input.userId,
  };
}