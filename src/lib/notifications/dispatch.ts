import "server-only";

import { NotificationChannel, NotificationStatus } from "@prisma/client";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

type DispatchResult = {
  processed: number;
  sent: number;
  failed: number;
};

function toE164(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");

  if (normalized.startsWith("+")) {
    return normalized;
  }

  if (normalized.startsWith("0")) {
    return `+254${normalized.slice(1)}`;
  }

  return `+${normalized}`;
}

function getRecipientContact(notification: {
  user: { phone: string | null; email: string | null } | null;
  tenant: { phone: string | null; email: string | null } | null;
}) {
  return {
    phone: notification.tenant?.phone ?? notification.user?.phone ?? null,
    email: notification.tenant?.email ?? notification.user?.email ?? null,
  };
}

async function sendSms({
  to,
  body,
}: {
  to: string;
  body: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error("Missing Twilio SMS environment variables.");
  }

  const client = twilio(accountSid, authToken);
  const message = await client.messages.create({
    from,
    to: toE164(to),
    body,
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}

async function sendWhatsapp({
  to,
  body,
}: {
  to: string;
  body: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error("Missing WhatsApp environment variables.");
  }

  const client = twilio(accountSid, authToken);
  const message = await client.messages.create({
    from: `whatsapp:${from.startsWith("+") ? from : `+${from}`}`,
    to: `whatsapp:${toE164(to)}`,
    body,
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}

async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  // Replace this with Resend, SendGrid, SES, or your provider of choice.
  console.log("sendNotificationEmail", { to, subject, body });

  return {
    provider: "console",
    status: "sent",
  };
}

export async function dispatchQueuedNotifications(
  limit = 50,
): Promise<DispatchResult> {
  const notifications = await prisma.notification.findMany({
    where: {
      status: NotificationStatus.QUEUED,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
    include: {
      user: {
        select: {
          phone: true,
          email: true,
        },
      },
      tenant: {
        select: {
          phone: true,
          email: true,
        },
      },
    },
  });

  let sent = 0;
  let failed = 0;

  for (const notification of notifications) {
    try {
      const contact = getRecipientContact(notification);
      const body = `${notification.title}\n\n${notification.message}`;
      let providerResponse: unknown;

      if (notification.channel === NotificationChannel.SMS) {
        if (!contact.phone) throw new Error("Recipient has no phone number.");
        providerResponse = await sendSms({ to: contact.phone, body });
      } else if (notification.channel === NotificationChannel.WHATSAPP) {
        if (!contact.phone) throw new Error("Recipient has no phone number.");
        providerResponse = await sendWhatsapp({ to: contact.phone, body });
      } else if (notification.channel === NotificationChannel.EMAIL) {
        if (!contact.email) throw new Error("Recipient has no email address.");
        providerResponse = await sendEmail({
          to: contact.email,
          subject: notification.title,
          body: notification.message,
        });
      } else {
        providerResponse = { status: "in-app" };
      }

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          providerResponse:
            providerResponse === undefined
              ? undefined
              : JSON.parse(JSON.stringify(providerResponse)),
        },
      });

      sent += 1;
    } catch (error) {
      failed += 1;

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          providerResponse: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
      });
    }
  }

  return {
    processed: notifications.length,
    sent,
    failed,
  };
}
