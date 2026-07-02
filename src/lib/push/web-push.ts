import "server-only";

import webPush, { type PushSubscription as WebPushSubscription } from "web-push";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

let configured = false;

function readEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    return "";
  }

  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function getWebPushPublicKey() {
  return (
    readEnv("NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY") || readEnv("WEB_PUSH_PUBLIC_KEY")
  );
}

export function isWebPushConfigured() {
  return Boolean(
    getWebPushPublicKey() &&
      readEnv("WEB_PUSH_PRIVATE_KEY") &&
      readEnv("WEB_PUSH_SUBJECT"),
  );
}

export function getPushPublicConfig() {
  return {
    enabled: isWebPushConfigured(),
    publicKey: getWebPushPublicKey(),
  };
}

function configureWebPush() {
  if (configured) {
    return;
  }

  const publicKey = getWebPushPublicKey();
  const privateKey = readEnv("WEB_PUSH_PRIVATE_KEY");
  const subject = readEnv("WEB_PUSH_SUBJECT");

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
