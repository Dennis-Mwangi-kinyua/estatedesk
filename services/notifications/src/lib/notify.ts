import "server-only";
import { createHash } from "node:crypto";

import {
  NotificationChannel,
  NotificationStatus,
  type NotificationType,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";
import { resolveNotificationActionUrl } from "@/lib/push/notification-links";

type NotificationDb = PrismaClient | Prisma.TransactionClient;

type NotificationRecipient = {
  userId?: string | null;
  tenantId?: string | null;
};

type NotifyInput = {
  db: NotificationDb;
  orgId: string;
  recipients: NotificationRecipient[];
  channels?: NotificationChannel[];
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  providerResponse?: Prisma.InputJsonValue;
  actorUserId?: string | null;
  eventKey?: string;
};

const DEFAULT_CHANNELS = [NotificationChannel.IN_APP] as const;

function recipientKey(recipient: NotificationRecipient, channel: NotificationChannel) {
  return [channel, recipient.userId ?? "", recipient.tenantId ?? ""].join(":");
}

export async function notifyRecipients({
  db,
  orgId,
  recipients,
  channels = [...DEFAULT_CHANNELS],
  type,
  title,
  message,
  actionUrl,
  providerResponse,
  actorUserId,
  eventKey,
}: NotifyInput) {
  const seen = new Set<string>();
  const now = new Date();
  const data: Prisma.NotificationCreateManyInput[] = [];
  // Normalize linked tenants so {tenantId}, {userId}, and both cannot fan out twice.
  const tenantIds = recipients.flatMap(r => r.tenantId ? [r.tenantId] : []);
  const userIds = recipients.flatMap(r => r.userId ? [r.userId] : []);
  const tenants = await db.tenant.findMany({
    where: { orgId, deletedAt: null, OR: [{ id: { in: tenantIds } }, { userId: { in: userIds } }] },
    select: { id: true, userId: true },
  });
  const normalized = recipients.map(recipient => {
    const tenant = recipient.userId
      ? tenants.find(t => t.userId === recipient.userId)
      : tenants.find(t => t.id === recipient.tenantId);
    return { userId: recipient.userId ?? tenant?.userId ?? null, tenantId: tenant?.id ?? null };
  });
  const recent = eventKey ? [] : await db.notification.findMany({
    where: { orgId, type, title, message, createdAt: { gte: new Date(now.getTime() - 600_000) },
      OR: normalized.map(recipient => ({ userId: recipient.userId, tenantId: recipient.tenantId })) },
    select: { userId: true, tenantId: true, channel: true },
  });
  for (const recipient of recent) seen.add(recipientKey(recipient, recipient.channel));
  // Content-based repeats are quiet for ten minutes; an explicit event key is permanent.
  const bucket = Math.floor(now.getTime() / 600_000);

  for (const recipient of normalized) {
    if (actorUserId && recipient.userId === actorUserId) continue;
    if (!recipient.userId && !recipient.tenantId) {
      continue;
    }

    for (const channel of channels) {
      const key = recipientKey(recipient, channel);

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      const resolvedActionUrl = resolveNotificationActionUrl({
        type,
        userId: recipient.userId,
        tenantId: recipient.tenantId,
        actionUrl,
      });

      const identity = JSON.stringify([orgId, channel, recipient.userId ?? recipient.tenantId, eventKey ?? [type, title, message, resolvedActionUrl, bucket]]);
      data.push({
        id: `ntf_${createHash("sha256").update(identity).digest("hex")}`,
        createdAt: now,
        orgId,
        userId: recipient.userId ?? null,
        tenantId: recipient.tenantId ?? null,
        channel,
        type,
        title,
        message,
        status:
          channel === NotificationChannel.IN_APP
            ? NotificationStatus.SENT
            : NotificationStatus.QUEUED,
        sentAt: channel === NotificationChannel.IN_APP ? now : null,
        providerResponse: {
          ...(typeof providerResponse === "object" && providerResponse !== null
            ? providerResponse
            : {}),
          actionUrl: resolvedActionUrl,
        },
      });
    }
  }

  if (data.length === 0) {
    return { count: 0 };
  }

  return db.notification.createMany({ data, skipDuplicates: true });
}

export function notifyInAppAndPush(
  input: Omit<NotifyInput, "channels">,
) {
  return notifyRecipients({
    ...input,
    channels: [NotificationChannel.IN_APP],
  });
}

export { NotificationChannel };
