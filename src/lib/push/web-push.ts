import "server-only";

import webPush, { type PushSubscription as WebPushSubscription } from "web-push";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

let configured = false;

export function getWebPushPublicKey() {
  return process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? process.env.WEB_PUSH_PUBLIC_KEY ?? "";
}

export function isWebPushConfigured() {
  return Boolean(
    getWebPushPublicKey() &&
      process.env.WEB_PUSH_PRIVATE_KEY &&
      process.env.WEB_PUSH_SUBJECT,
  );
}

function configureWebPush() {
  if (configured) {
    return;
  }

  const publicKey = getWebPushPublicKey();
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("Web Push is not configured. Set WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY, and WEB_PUSH_SUBJECT.");
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export async function sendWebPushNotification({
  subscription,
  payload,
}: {
  subscription: WebPushSubscription;
  payload: PushPayload;
}) {
  configureWebPush();

  return webPush.sendNotification(
    subscription,
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? "/dashboard",
      tag: payload.tag,
    }),
  );
}
