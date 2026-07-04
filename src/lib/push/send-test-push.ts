import "server-only";

import { prisma } from "@/lib/prisma";
import { isWebPushConfigured, sendWebPushNotification } from "@/lib/push/web-push";

function getWebPushErrorStatusCode(error: unknown) {
  if (typeof error === "object" && error && "statusCode" in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    return typeof statusCode === "number" ? statusCode : null;
  }

  return null;
}

export async function sendTestPushToUser({
  userId,
  url = "/dashboard",
}: {
  userId: string;
  url?: string;
}) {
  if (!isWebPushConfigured()) {
    throw new Error("Web Push is not configured.");
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    throw new Error("No active push subscriptions found for this account.");
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
          title: "EstateDesk test alert",
          body: "Push alerts are working on this device.",
          url,
          tag: "estatedesk-push-test",
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
    throw new Error("Test alert could not be delivered to this device.");
  }

  return {
    attempted: subscriptions.length,
    sent,
    expired: expiredEndpoints.length,
  };
}