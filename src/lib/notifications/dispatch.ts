import "server-only";

import { NotificationChannel, NotificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendWebPushNotification } from "@/lib/push/web-push";
import { sendMetaWhatsappText } from "@/lib/whatsapp/meta";

type DispatchResult = {
  processed: number;
  sent: number;
  failed: number;
};

function getRecipientContact(notification: {
  user: { id: string; phone: string | null; email: string | null } | null;
  tenant: { userId: string | null; phone: string | null; email: string | null } | null;
}) {
  return {
    phone: notification.tenant?.phone ?? notification.user?.phone ?? null,
    email: notification.tenant?.email ?? notification.user?.email ?? null,
    userId: notification.user?.id ?? notification.tenant?.userId ?? null,
  };
}

async function sendSms({
  to,
  body,
}: {
  to: string;
  body: string;
}) {
  void to;
  void body;
  throw new Error("SMS delivery is disabled. EstateDesk is configured for Meta WhatsApp, email, and in-app notifications.");
}

async function sendWhatsapp({
  to,
  body,
}: {
  to: string;
  body: string;
}) {
  return sendMetaWhatsappText({ to, body });
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
  if (process.env.NODE_ENV !== "production") {
    console.log("sendNotificationEmail", { to, subject, body });
  }

  return {
    provider: "console",
    status: "sent",
  };
}

function getWebPushErrorStatusCode(error: unknown) {
  if (typeof error === "object" && error && "statusCode" in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    return typeof statusCode === "number" ? statusCode : null;
  }

  return null;
}

async function sendWebPush({
  userId,
  title,
  body,
  notificationId,
}: {
  userId: string;
  title: string;
  body: string;
  notificationId: string;
}) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    throw new Error("Recipient has no active push subscriptions.");
  }

  const results = await Promise.allSettled(
    subscriptions.map((subscription) =>
      sendWebPushNotification({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload: {
          title,
          body,
          tag: notificationId,
        },
      }),
    ),
  );

  const expiredEndpoints = subscriptions
    .filter((_, index) => {
      const result = results[index];
      return (
        result?.status === "rejected" &&
        [404, 410].includes(getWebPushErrorStatusCode(result.reason) ?? 0)
      );
    })
    .map((subscription) => subscription.endpoint);

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint: {
          in: expiredEndpoints,
        },
      },
    });
  }

  const sent = results.filter((result) => result.status === "fulfilled").length;

  if (sent === 0) {
    const firstError = results.find((result) => result.status === "rejected");
    const message =
      firstError?.status === "rejected" && firstError.reason instanceof Error
        ? firstError.reason.message
        : "Web Push delivery failed.";

    throw new Error(message);
  }

  return {
    provider: "web-push",
    attempted: subscriptions.length,
    sent,
    expired: expiredEndpoints.length,
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
          id: true,
          phone: true,
          email: true,
        },
      },
      tenant: {
        select: {
          userId: true,
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
      } else if (notification.channel === NotificationChannel.WEB_PUSH) {
        if (!contact.userId) throw new Error("Recipient has no linked user account.");
        providerResponse = await sendWebPush({
          userId: contact.userId,
          title: notification.title,
          body: notification.message,
          notificationId: notification.id,
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
