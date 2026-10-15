import { readNotificationActionUrl } from "../push/notification-links";

type ReadTarget = { all: true } | { id: string };

/** Shared browser request; announce success only after the server accepts it. */
export async function acknowledgeNotification(target: ReadTarget): Promise<string | null> {
  const response = await fetch("/api/notifications/read", {
    signal: AbortSignal.timeout(12_000),
    keepalive: true,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(target),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error("Unable to mark notifications as read. Please try again.");
  }
  window.dispatchEvent(new Event("estatedesk:notifications-read"));
  return readNotificationActionUrl(result);
}
