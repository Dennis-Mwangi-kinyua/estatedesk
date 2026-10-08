"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import type { UnreadNotificationAlert } from "@/lib/notifications/unread-alert";
import { NotificationViewButton } from "./notification-view-button";

/** One quiet summary; navigation never creates another floating popup. */
export function UnreadNotificationAlerts({ scope, alert }: { scope: string; alert: UnreadNotificationAlert }) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const key = `${scope}:${alert.latest?.id ?? ""}`;
  if (alert.count <= 0 || !alert.latest || dismissed === key) return null;
  return <aside aria-label="Unread notifications" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 text-foreground">
    <Bell className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{alert.count} unread notification{alert.count === 1 ? "" : "s"}</p><p className="mt-1 text-sm text-muted-foreground">{alert.latest.title}</p></div>
    <NotificationViewButton notificationId={alert.latest.id} onViewed={() => setDismissed(key)}>View</NotificationViewButton>
    <NotificationViewButton all href={alert.href} onViewed={() => setDismissed(key)}>View all</NotificationViewButton>
    <button data-workspace-action="true" type="button" aria-label="Dismiss notification summary" onClick={() => setDismissed(key)} className="rounded-lg p-2"><X className="h-4 w-4" /></button>
  </aside>;
}
