"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { syncAppBadge } from "@/lib/pwa/badge";
import { isSecurityGatePathname } from "@/lib/auth/security-gate";
import {
  getPollingIntervalMs,
  isBackgroundRefreshEnabled,
} from "@/lib/dev/background-refresh";

async function refreshAppBadge() {
  try {
    const response = await fetch("/api/pwa/badge-count", {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { count?: number };
    await syncAppBadge(payload.count ?? 0);
  } catch {
    // Badge sync should never block the app.
  }
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
        void refreshAppBadge();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
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