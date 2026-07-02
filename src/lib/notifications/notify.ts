import "server-only";

import {
  NotificationChannel,
  NotificationStatus,
  type NotificationType,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

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
  providerResponse?: Prisma.InputJsonValue;
};

const DEFAULT_CHANNELS = [
  NotificationChannel.IN_APP,
  NotificationChannel.SMS,
  NotificationChannel.WHATSAPP,
  NotificationChannel.EMAIL,
  NotificationChannel.WEB_PUSH,
] as const;

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
  providerResponse,
}: NotifyInput) {
  const seen = new Set<string>();
  const now = new Date();
  const data: Prisma.NotificationCreateManyInput[] = [];

  for (const recipient of recipients) {
    if (!recipient.userId && !recipient.tenantId) {
      continue;
    }

    for (const channel of channels) {
      const key = recipientKey(recipient, channel);

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      data.push({
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
        providerResponse,
      });
    }
  }

  if (data.length === 0) {
    return { count: 0 };
  }

  return db.notification.createMany({ data });
}

export { NotificationChannel };
