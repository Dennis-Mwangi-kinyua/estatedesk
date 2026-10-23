"use client";

import { useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

/** One stream for the workspace; full records still use existing authorized reads. */
export function WorkspaceLiveUpdates() {
  const router = useRouter();
  const platform = usePathname().startsWith("/platform");
  const provider = usePathname().startsWith("/provider");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let source: EventSource | null = null;
    let disposed = false;
    let connected = false;
    let attempts = 0;
    let dirty = false;
    let lastRefresh = 0;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    const active = () => document.visibilityState === "visible" && navigator.onLine;
    const editing = () => {
      const element = document.activeElement;
      return element instanceof HTMLElement && (element.matches("input, textarea, select") || element.isContentEditable);
    };
    const flush = () => {
      refreshTimer = undefined;
      if (!dirty || !active()) return;
      if (editing()) { refreshTimer = setTimeout(flush, 2000); return; }
      const wait = 3000 - (Date.now() - lastRefresh);
      if (wait > 0) { refreshTimer = setTimeout(flush, wait); return; }
      dirty = false; lastRefresh = Date.now();
      startTransition(() => router.refresh());
      window.dispatchEvent(new Event("estatedesk:workspace-updated"));
    };
    const changed = () => {
      dirty = true;
      if (!refreshTimer) refreshTimer = setTimeout(flush, 750);
    };
    const stop = () => {
      connected = false;
      source?.close(); source = null;
      clearTimeout(reconnectTimer);
    };
    const connect = () => {
      if (disposed || !active() || source || !("EventSource" in window)) return;
      const stream = new EventSource(platform ? "/api/realtime?workspace=platform" : provider ? "/api/realtime?workspace=provider" : "/api/realtime"); source = stream;
      stream.addEventListener("ready", () => {
        connected = true; attempts = 0;
        // Reconcile missed events on every new connection; NOTIFY is not a log.
        changed();
      });
      stream.addEventListener("change", changed);
      stream.onerror = () => {
        if (source !== stream) return;
        stop();
        const delay = Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)) + Math.random() * 1000;
        reconnectTimer = setTimeout(connect, delay);
      };
    };
    const resume = () => {
      if (!active()) { stop(); return; }
      connect();
      if (dirty) changed();
    };
    // Only a degraded connection uses periodic refresh. Healthy idle streams
    // send heartbeats without database reads or page reloads.
    const fallback = setInterval(() => { if (active() && !connected) changed(); }, 90000);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    window.addEventListener("offline", resume);
    connect();
    return () => {
      disposed = true; stop(); clearTimeout(refreshTimer); clearInterval(fallback);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener("offline", resume);
    };
  }, [router, startTransition, platform, provider]);

  // React retains component/form state during the server refresh.
  return pending ? <span className="sr-only" role="status">Updating workspace data…</span> : null;
}
