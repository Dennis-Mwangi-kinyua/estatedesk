"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { isIosDevice, isStandaloneDisplayMode } from "@/lib/pwa/client";

const DISMISS_KEY = "estatedesk-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isPrivateAppRoute(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/platform") ||
    pathname.startsWith("/staff")
  );
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const pathname = window.location.pathname;

    if (!isPrivateAppRoute(pathname) || isStandaloneDisplayMode()) {
      return;
    }

    if (window.localStorage.getItem(DISMISS_KEY) === "1") {
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (isIosDevice()) {
      setShowIosHelp(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  function dismissPrompt() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function installApp() {
    if (!deferredPrompt) {
      return;
    }

    setPending(true);

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      dismissPrompt();
    } finally {
      setPending(false);
      setDeferredPrompt(null);
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <section className="fixed bottom-5 right-4 z-50 w-[min(100vw-2rem,22rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/15 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            Install EstateDesk
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Open your dashboard like an app with faster access and alerts.
          </p>
        </div>
        <button
          type="button"
          onClick={dismissPrompt}
          className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {showIosHelp && !deferredPrompt ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-200">
          <Share className="mt-0.5 h-4 w-4 shrink-0" />
          Tap Share, then Add to Home Screen.
        </p>
      ) : null}

      {deferredPrompt ? (
        <button
          type="button"
          onClick={installApp}
          disabled={pending}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-slate-950"
        >
          <Download className="h-4 w-4" />
          {pending ? "Installing..." : "Install app"}
        </button>
      ) : null}
    </section>
  );
}