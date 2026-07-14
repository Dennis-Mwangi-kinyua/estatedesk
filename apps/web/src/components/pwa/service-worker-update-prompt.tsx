"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { activateWaitingServiceWorker } from "@/lib/pwa/client";
import { isStandaloneDisplayMode } from "@/lib/pwa/client";

export function ServiceWorkerUpdatePrompt() {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (!isStandaloneDisplayMode()) {
      return;
    }

    function handleControllerChange() {
      window.location.reload();
    }

    function markUpdateAvailable() {
      setVisible(true);
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker.ready
      .then((registration) => {
        if (registration.waiting) {
          markUpdateAvailable();
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;

          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              markUpdateAvailable();
            }
          });
        });
      })
      .catch(() => null);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  async function applyUpdate() {
    setPending(true);

    try {
      const activated = await activateWaitingServiceWorker();

      if (!activated) {
        window.location.reload();
      }
    } finally {
      setPending(false);
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <section className="fixed bottom-5 left-1/2 z-50 w-[min(100vw-2rem,30rem)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/15 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            Update available
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            A newer version of EstateDesk is ready. Refresh to load the latest fixes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Dismiss update prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={applyUpdate}
        disabled={pending}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-slate-950"
      >
        <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Refreshing..." : "Refresh app"}
      </button>
    </section>
  );
}
