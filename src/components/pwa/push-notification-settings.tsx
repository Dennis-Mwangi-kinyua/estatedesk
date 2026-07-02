"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, Smartphone } from "lucide-react";
import {
  ensureServiceWorkerRegistration,
  isIosDevice,
  isStandaloneDisplayMode,
  urlBase64ToUint8Array,
} from "@/lib/pwa/client";

type PushSettingsState =
  | "checking"
  | "unsupported"
  | "disabled"
  | "prompt"
  | "subscribed"
  | "denied";

export function PushNotificationSettings() {
  const [state, setState] = useState<PushSettingsState>("checking");
  const [publicKey, setPublicKey] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadState() {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        setState("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }

      const response = await fetch("/api/push/vapid-public-key", {
        cache: "no-store",
      }).catch(() => null);

      if (!response?.ok) {
        setState("disabled");
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { enabled?: boolean; publicKey?: string }
        | null;

      if (!active) {
        return;
      }

      if (!data?.enabled || !data.publicKey) {
        setState("disabled");
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
          setState("subscribed");
          return;
        }
      }

      setState("prompt");
    }

    loadState().catch(() => setState("disabled"));

    return () => {
      active = false;
    };
  }, []);

  async function enablePushNotifications() {
    setPending(true);
    setMessage(null);

    try {
      const permission = await Notification.requestPermission();

      if (permission === "denied") {
        setState("denied");
        setMessage("Notifications are blocked in your browser settings.");
        return;
      }

      if (permission !== "granted") {
        setState("prompt");
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

      setState("subscribed");
      setMessage("Browser alerts are enabled for this device.");
    } catch {
      setState("prompt");
      setMessage("Could not enable alerts. Try again after reloading the app.");
    } finally {
      setPending(false);
    }
  }

  async function disablePushNotifications() {
    setPending(true);
    setMessage(null);

    try {
      const registration = await ensureServiceWorkerRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/subscriptions", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => null);

        await subscription.unsubscribe();
      }

      setState("prompt");
      setMessage("Browser alerts are disabled for this device.");
    } catch {
      setMessage("Could not disable alerts. Try again after reloading the app.");
    } finally {
      setPending(false);
    }
  }

  const iosGuidance =
    isIosDevice() && !isStandaloneDisplayMode()
      ? "On iPhone or iPad, add EstateDesk to your Home Screen first, then enable alerts from this profile."
      : null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">
            App alerts
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Receive payment, issue, inspection, and workflow alerts on this device.
          </p>
        </div>
      </div>

      {iosGuidance ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
          {iosGuidance}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {state === "subscribed" ? (
          <button
            type="button"
            onClick={disablePushNotifications}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            <BellOff className="h-4 w-4" />
            {pending ? "Updating..." : "Disable alerts"}
          </button>
        ) : null}

        {state === "prompt" ? (
          <button
            type="button"
            onClick={enablePushNotifications}
            disabled={pending || !publicKey}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            <BellRing className="h-4 w-4" />
            {pending ? "Enabling..." : "Enable alerts"}
          </button>
        ) : null}

        {state === "unsupported" ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This browser does not support push alerts.
          </p>
        ) : null}

        {state === "disabled" ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Push alerts are not configured for this environment yet.
          </p>
        ) : null}

        {state === "denied" ? (
          <p className="text-sm text-rose-600 dark:text-rose-300">
            Notifications are blocked. Allow them in your browser or device settings.
          </p>
        ) : null}

        {state === "checking" ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Checking alert support...</p>
        ) : null}
      </div>

      {message ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p>
      ) : null}
    </section>
  );
}