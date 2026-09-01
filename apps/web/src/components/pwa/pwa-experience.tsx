"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CloudOff,
  Download,
  Info,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Wifi,
  X,
} from "lucide-react";
import { activateWaitingServiceWorker, isStandaloneDisplayMode } from "@/lib/pwa/client";

const LOCK_ENABLED_KEY = "estatedesk:pwa-lock-enabled";
const LOCK_DIGEST_KEY = "estatedesk:pwa-lock-digest";
const LOCKED_KEY = "estatedesk:pwa-locked";
const BACKGROUND_LOCK_DELAY_MS = 60_000;

async function digestPin(pin: string) {
  const bytes = new TextEncoder().encode(`estatedesk-pwa-lock:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function PwaExperience() {
  const pathname = usePathname();
  const [standalone, setStandalone] = useState(false);
  const [online, setOnline] = useState(true);
  const [reconnected, setReconnected] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [slowNavigation, setSlowNavigation] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [lockMessage, setLockMessage] = useState("");

  const finishNavigation = useCallback(() => {
    setNavigating(false);
    setSlowNavigation(false);
  }, []);

  useEffect(() => {
    const isStandalone = isStandaloneDisplayMode();
    if (!isStandalone) return;
    const enabled = localStorage.getItem(LOCK_ENABLED_KEY) === "true";
    const initializeTimer = window.setTimeout(() => {
      setStandalone(true);
      setOnline(navigator.onLine);
      setLockEnabled(enabled);
      setLocked(enabled && sessionStorage.getItem(LOCKED_KEY) === "true");
    }, 0);

    let reconnectTimer = 0;
    let slowTimer = 0;
    let backgroundedAt: number | null = null;

    const handleOffline = () => {
      setOnline(false);
      setReconnected(false);
    };
    const handleOnline = () => {
      setOnline(true);
      setReconnected(true);
      reconnectTimer = window.setTimeout(() => setReconnected(false), 3_500);
    };
    const handlePageShow = () => finishNavigation();
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href || destination.hash) return;
      setNavigating(true);
      setSlowNavigation(false);
      window.clearTimeout(slowTimer);
      slowTimer = window.setTimeout(() => setSlowNavigation(true), 4_000);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        backgroundedAt = Date.now();
        return;
      }
      if (
        localStorage.getItem(LOCK_ENABLED_KEY) === "true" &&
        backgroundedAt &&
        Date.now() - backgroundedAt >= BACKGROUND_LOCK_DELAY_MS
      ) {
        sessionStorage.setItem(LOCKED_KEY, "true");
        setLocked(true);
      }
      backgroundedAt = null;
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("visibilitychange", handleVisibility);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((nextRegistration) => {
        setRegistration(nextRegistration);
        setUpdateReady(Boolean(nextRegistration.waiting));
      }).catch(() => null);
    }

    return () => {
      window.clearTimeout(initializeTimer);
      window.clearTimeout(reconnectTimer);
      window.clearTimeout(slowTimer);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [finishNavigation]);

  useEffect(() => {
    if (!standalone || !navigating) return;
    const timer = window.setTimeout(finishNavigation, 15_000);
    return () => window.clearTimeout(timer);
  }, [finishNavigation, navigating, standalone]);

  useEffect(() => {
    const timer = window.setTimeout(finishNavigation, 0);
    return () => window.clearTimeout(timer);
  }, [finishNavigation, pathname]);

  async function checkForUpdates() {
    if (!registration) return;
    setChecking(true);
    try {
      await registration.update();
      setUpdateReady(Boolean(registration.waiting));
    } finally {
      setChecking(false);
    }
  }

  async function applyUpdate() {
    const activated = await activateWaitingServiceWorker();
    if (!activated) window.location.reload();
  }

  async function configureLock() {
    if (lockEnabled) {
      localStorage.removeItem(LOCK_ENABLED_KEY);
      localStorage.removeItem(LOCK_DIGEST_KEY);
      sessionStorage.removeItem(LOCKED_KEY);
      setLockEnabled(false);
      setLocked(false);
      setPin("");
      setLockMessage("Privacy lock disabled.");
      return;
    }
    if (!/^\d{4,8}$/.test(pin)) {
      setLockMessage("Enter a 4–8 digit PIN first.");
      return;
    }
    localStorage.setItem(LOCK_DIGEST_KEY, await digestPin(pin));
    localStorage.setItem(LOCK_ENABLED_KEY, "true");
    setLockEnabled(true);
    setPin("");
    setLockMessage("Privacy lock enabled. It locks after one minute in the background.");
  }

  async function unlock() {
    const expected = localStorage.getItem(LOCK_DIGEST_KEY);
    if (!expected || (await digestPin(pin)) !== expected) {
      setLockMessage("Incorrect PIN.");
      return;
    }
    sessionStorage.removeItem(LOCKED_KEY);
    setLocked(false);
    setPin("");
    setLockMessage("");
  }

  if (!standalone) return null;

  return (
    <>
      {navigating ? (
        <div className="fixed inset-x-0 top-0 z-[10000]" role="status" aria-live="polite">
          <div className="h-1 w-full overflow-hidden bg-slate-200/80"><div className="h-full w-1/2 animate-pulse bg-teal-600" /></div>
          {slowNavigation ? (
            <div className="mx-auto mt-3 flex w-[min(92vw,28rem)] items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 shadow-lg">
              <span>This is taking longer than usual. Your connection may be slow.</span>
              <button type="button" onClick={() => window.location.reload()} className="shrink-0 font-semibold underline">Reload</button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!online || reconnected ? (
        <div className={`fixed inset-x-3 top-[max(.75rem,env(safe-area-inset-top))] z-[10001] mx-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${online ? "bg-emerald-700 text-white" : "bg-slate-950 text-white"}`} role="status">
          {online ? <Wifi className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}
          <span>{online ? "You’re back online. Pending work can now sync." : "You’re offline. Cached pages and queued caretaker work remain available."}</span>
        </div>
      ) : null}

      <button type="button" onClick={() => setShowInfo(true)} className="fixed bottom-[max(5.5rem,env(safe-area-inset-bottom))] right-4 z-[9000] grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg dark:border-white/15 dark:bg-slate-900 dark:text-white" aria-label="PWA app information">
        <Info className="h-5 w-5" />
      </button>

      {showInfo ? (
        <div className="fixed inset-0 z-[10002] grid place-items-end bg-slate-950/45 p-3 sm:place-items-center" role="dialog" aria-modal="true" aria-label="EstateDesk app information">
          <section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <div className="flex items-start justify-between"><div><p className="font-semibold text-slate-950 dark:text-white">EstateDesk installed app</p><p className="mt-1 text-sm text-slate-500">Version {process.env.NEXT_PUBLIC_APP_VERSION ?? "0.2.0"} · {online ? "Online" : "Offline"}</p></div><button type="button" onClick={() => setShowInfo(false)} aria-label="Close"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 grid gap-3">
              <button type="button" onClick={updateReady ? applyUpdate : checkForUpdates} disabled={checking} className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">
                {updateReady ? <Download className="h-4 w-4" /> : <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />}{updateReady ? "Install available update" : checking ? "Checking…" : "Check for updates"}
              </button>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-white/15">
                <div className="flex items-center gap-2 font-medium"><LockKeyhole className="h-4 w-4" />Optional privacy lock</div>
                <p className="mt-1 text-xs leading-5 text-slate-500">Adds a local screen lock after one minute away. Your EstateDesk login remains the security boundary.</p>
                {!lockEnabled ? <input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" type="password" placeholder="Choose 4–8 digit PIN" className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-white/20 dark:bg-slate-950" /> : null}
                <button type="button" onClick={configureLock} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold dark:border-white/20">{lockEnabled ? "Disable privacy lock" : "Enable privacy lock"}</button>
                {lockMessage ? <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{lockMessage}</p> : null}
              </div>
              <button type="button" onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold dark:border-white/20"><RefreshCw className="h-4 w-4" />Reload app</button>
            </div>
          </section>
        </div>
      ) : null}

      {locked ? (
        <div className="fixed inset-0 z-[2147483647] grid place-items-center bg-slate-950 p-5" role="dialog" aria-modal="true" aria-label="EstateDesk privacy lock">
          <section className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <ShieldCheck className="mx-auto h-10 w-10 text-teal-700" /><h2 className="mt-3 text-lg font-semibold text-slate-950">EstateDesk is locked</h2><p className="mt-1 text-sm text-slate-600">Enter your app privacy PIN to continue.</p>
            <input autoFocus value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))} onKeyDown={(event) => { if (event.key === "Enter") void unlock(); }} inputMode="numeric" type="password" className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-lg tracking-[.35em]" aria-label="Privacy PIN" />
            {lockMessage ? <p className="mt-2 text-sm text-red-600">{lockMessage}</p> : null}<button type="button" onClick={unlock} className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white">Unlock</button>
          </section>
        </div>
      ) : null}
    </>
  );
}
