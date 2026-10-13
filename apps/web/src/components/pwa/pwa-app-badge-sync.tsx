"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { syncAppBadge, isAppBadgeSupported } from "@/lib/pwa/badge";
import { isSecurityGatePathname } from "@/lib/auth/security-gate";
import {
  getPollingIntervalMs,
  isBackgroundRefreshEnabled,
} from "@/lib/dev/background-refresh";

let badgeRequest: Promise<void> | null = null;
let lastBadgeRefresh = 0;

async function refreshAppBadge(force = false) {
  if (!isAppBadgeSupported() || document.visibilityState !== "visible") return;
  if (badgeRequest) return badgeRequest;
  if (!force && Date.now() - lastBadgeRefresh < 30_000) return;
  lastBadgeRefresh = Date.now();
  badgeRequest = (async () => {
    try {
      const response = await fetch("/api/pwa/badge-count", { cache: "no-store", signal: AbortSignal.timeout(8_000) });
      if (!response.ok) return;
      const payload = (await response.json()) as { count?: number };
      await syncAppBadge(payload.count ?? 0);
    } catch {
      // Keep the previous badge when offline or the server is temporarily slow.
    }
  })();
  try { await badgeRequest; } finally { badgeRequest = null; }
}

export function PwaAppBadgeSync() {
  const pathname = usePathname();

  useEffect(() => {
    if (isSecurityGatePathname(pathname)) {
      return;
    }

    const backgroundRefreshEnabled = isBackgroundRefreshEnabled();

    if (backgroundRefreshEnabled) {
      void refreshAppBadge();
    }

    function handleVisibilityChange() {
      if (!backgroundRefreshEnabled) return;
      if (document.visibilityState === "visible") {
        void refreshAppBadge();
      }
    }

    function handleFocus() {
      if (!backgroundRefreshEnabled) return;
      void refreshAppBadge();
    }

    function handleServiceWorkerMessage(event: MessageEvent) {
      if (event.data?.type === "SYNC_APP_BADGE") {
        void refreshAppBadge(true);
      }
    }

    const handleNotificationsRead = () => { void refreshAppBadge(true); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("estatedesk:notifications-read", handleNotificationsRead);
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);

    const badgeIntervalMs = getPollingIntervalMs(5 * 60 * 1000);
    const intervalId =
      badgeIntervalMs > 0
        ? window.setInterval(() => {
            if (document.visibilityState === "visible") {
              void refreshAppBadge();
            }
          }, badgeIntervalMs)
        : undefined;

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("estatedesk:notifications-read", handleNotificationsRead);
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [pathname]);

  return null;
}