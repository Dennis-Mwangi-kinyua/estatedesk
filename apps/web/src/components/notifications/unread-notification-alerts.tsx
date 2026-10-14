"use client";

import { useState } from "react";
import { ArrowUpRight, BellRing, CreditCard, X } from "lucide-react";
import type { UnreadNotificationAlert } from "@/lib/notifications/unread-alert";
import { NotificationViewButton } from "./notification-view-button";

export function UnreadNotificationAlerts({ scope, alert }: { scope: string; alert: UnreadNotificationAlert }) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const key = `${scope}:${alert.latest?.id ?? ""}`;
  if (alert.count <= 0 || !alert.latest || dismissed === key) return null;
  const paymentUpdate = /payment|rent.*verification/i.test(alert.latest.title) || ["PAYMENT_RECEIVED", "PAYMENT_VERIFIED"].includes(alert.latest.type);
  const needsReview = /needs verification/i.test(alert.latest.title);
  const Icon = paymentUpdate ? CreditCard : BellRing;

  return (
    <aside aria-label="Unread notifications" className="relative mb-5 overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
      <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{paymentUpdate ? "Payment update" : "Latest update"}</p>
            {needsReview ? <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">Review required</span> : null}
          </div>
          <h2 className="mt-2 break-words text-sm font-semibold leading-6 sm:text-base">{alert.latest.title}</h2>
          <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">{alert.latest.message}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <NotificationViewButton notificationId={alert.latest.id} href={alert.latest.actionUrl} title={alert.latest.title} message={alert.latest.message} onViewedAction={() => setDismissed(key)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">
              {needsReview ? "Review payment" : "View update"}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </NotificationViewButton>
            <NotificationViewButton all href={alert.href} onViewedAction={() => setDismissed(key)} className="min-h-10 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60">View all ({alert.count})</NotificationViewButton>
          </div>
        </div>
        <button data-workspace-action="true" type="button" aria-label="Dismiss notification summary" onClick={() => setDismissed(key)} className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"><X className="h-4 w-4" /></button>
      </div>
    </aside>
  );
}
