"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ExternalLink, X } from "lucide-react";
import type { UnreadNotificationAlert } from "@/lib/notifications/unread-alert";

type UnreadNotificationAlertsProps = {
  scope: string;
  alert: UnreadNotificationAlert;
};

function popupStorageKey(scope: string, notificationId: string) {
  return `estatedesk-notification-popup:${scope}:${notificationId}`;
}

export function UnreadNotificationBanner({
  alert,
}: {
  alert: UnreadNotificationAlert;
}) {
  if (alert.count <= 0) {
    return null;
  }

  const latestTitle = alert.latest?.title ?? "New update";
  const latestDetail =
    alert.latest?.message ?? "Open notifications to review the latest activity.";

  return (
    <Link
      href={alert.latest?.actionUrl ?? alert.href}
      className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-400/50 dark:bg-amber-950 dark:text-amber-50 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.15)] dark:hover:border-amber-300/70 dark:hover:bg-amber-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100">
          <Bell className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-amber-950 dark:text-amber-50">
            {alert.count} new notification{alert.count === 1 ? "" : "s"} need
            attention
          </span>
          <span className="mt-1 block text-sm text-amber-900/80 dark:text-amber-100/90">
            Latest: {latestTitle}. {latestDetail}
          </span>
        </span>
      </span>
      <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-amber-900 px-3 text-xs font-semibold text-white dark:bg-amber-400 dark:text-amber-950">
        Open notifications
        <ExternalLink className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

/**
 * Coordinates popup + in-page bar so they never stack on the top chrome.
 * Popup appears bottom-right first; after dismiss, the content banner remains.
 */
export function UnreadNotificationAlerts({
  scope,
  alert,
}: UnreadNotificationAlertsProps) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (alert.count <= 0 || !alert.latest?.id) {
      setPopupOpen(false);
      return;
    }

    const storageKey = popupStorageKey(scope, alert.latest.id);
    if (window.localStorage.getItem(storageKey) === "dismissed") {
      setPopupOpen(false);
      return;
    }

    const timer = window.setTimeout(() => setPopupOpen(true), 300);
    return () => window.clearTimeout(timer);
  }, [alert.count, alert.latest?.id, scope]);

  function dismissPopup() {
    if (alert.latest?.id) {
      window.localStorage.setItem(
        popupStorageKey(scope, alert.latest.id),
        "dismissed",
      );
    }
    setPopupOpen(false);
  }

  if (alert.count <= 0) {
    return null;
  }

  // Hide the top content bar while the floating popup is visible
  const showBanner = hydrated && !popupOpen;

  return (
    <>
      {showBanner ? <UnreadNotificationBanner alert={alert} /> : null}

      {popupOpen && alert.latest ? (
        <div
          role="dialog"
          aria-label="New notification"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex justify-end p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:p-0 lg:bottom-8 lg:right-8"
        >
          {/* mb clears mobile bottom tab bars; sm+ sits cleanly bottom-right */}
          <div className="pointer-events-auto mb-14 w-full max-w-md rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-2xl dark:border-amber-400/50 dark:bg-amber-950 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:mb-0 sm:w-[22rem]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100">
                <Bell className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">
                  New notification
                </p>
                <p className="mt-1 text-sm font-medium text-amber-950 dark:text-amber-50">
                  {alert.latest.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-100/90">
                  {alert.latest.message}
                  {alert.count > 1
                    ? ` You have ${alert.count} unread notifications.`
                    : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={alert.latest.actionUrl}
                    onClick={dismissPopup}
                    className="inline-flex min-h-9 items-center rounded-lg bg-amber-900 px-3 text-xs font-semibold text-white transition hover:bg-amber-800 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300"
                  >
                    Review now
                  </Link>
                  <Link
                    href={alert.href}
                    onClick={dismissPopup}
                    className="inline-flex min-h-9 items-center rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
                  >
                    View all
                  </Link>
                  <button
                    type="button"
                    onClick={dismissPopup}
                    className="inline-flex min-h-9 items-center rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissPopup}
                aria-label="Dismiss notification alert"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-700 transition hover:bg-amber-100 hover:text-amber-950 dark:text-amber-200 dark:hover:bg-amber-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
