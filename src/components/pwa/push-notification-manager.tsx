"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { usePathname } from "next/navigation";

type PushAvailability = "checking" | "unsupported" | "disabled" | "prompt" | "subscribed" | "denied";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function ensureServiceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration("/");

  if (existing) {
    return existing;
  }

  return navigator.serviceWorker.register("/sw.js");
}

function isPrivateAppRoute(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/platform") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/change-password")
  );
}

export function PushNotificationManager() {
  const pathname = usePathname();
  const [availability, setAvailability] = useState<PushAvailability>("checking");
  const [publicKey, setPublicKey] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAvailability() {
      if (!isPrivateAppRoute(pathname)) {
        setAvailability("unsupported");
        return;
      }

      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        setAvailability("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setAvailability("denied");
        return;
      }

      const response = await fetch("/api/push/vapid-public-key", {
        cache: "no-store",
      }).catch(() => null);

      if (!response?.ok) {
        setAvailability("disabled");
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { enabled?: boolean; publicKey?: string }
        | null;

      if (!active) {
        return;
      }

      if (!data?.enabled || !data.publicKey) {
        setAvailability("disabled");
        return;
      }

      setPublicKey(data.publicKey);

      if (Notification.permission === "granted") {
        const registration = await ensureServiceWorkerRegistration();
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await fetch("/api/push/subscriptions", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(subscription),
          }).catch(() => null);
          setAvailability("subscribed");
          return;
        }
      }

      setAvailability("prompt");
    }

    checkAvailability().catch(() => setAvailability("disabled"));

    return () => {
      active = false;
    };
  }, [pathname]);

  async function enablePushNotifications() {
    setPending(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission === "denied") {
        setAvailability("denied");
        return;
      }

      if (permission !== "granted") {
        setAvailability("prompt");
        return;
      }

      const registration = await ensureServiceWorkerRegistration();
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const response = await fetch("/api/push/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error("Push subscription could not be saved.");
      }

      setAvailability("subscribed");
    } catch {
      setAvailability("prompt");
    } finally {
      setPending(false);
    }
  }

  if (availability !== "prompt") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={enablePushNotifications}
      disabled={pending || !publicKey}
      className="fixed bottom-5 left-4 z-50 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/30 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
    >
      <BellRing className="h-4 w-4" />
      {pending ? "Enabling..." : "Enable alerts"}
    </button>
  );
}
