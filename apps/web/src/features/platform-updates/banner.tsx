"use client";
import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { formatUpdateTime, type UpdateNotice } from "./policy";
import { getPollingIntervalMs } from "@/lib/dev/background-refresh";

export function ScheduledUpdateBanner() {
  const [notice, setNotice] = useState<UpdateNotice | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const intervalMs = getPollingIntervalMs(60000);
    let refreshing = false;
    let retryAfter = 0;
    const refresh = async () => {
      if (refreshing || Date.now() < retryAfter || document.visibilityState !== "visible") return;
      refreshing = true;
      try {
        const response = await fetch("/api/platform/update-notice", { cache: "no-store", signal: controller.signal });
        if (response.ok) {
          setNotice(await response.json());
        } else {
          const seconds = Number(response.headers.get("Retry-After"));
          retryAfter = Date.now() + Math.min(900, Math.max(60, Number.isFinite(seconds) ? seconds : 60)) * 1000;
        }
      } catch {
        // Keep the last notice and avoid retries on every visibility change.
        retryAfter = Date.now() + 60000;
      }
      finally { refreshing = false; }
    };
    void refresh();
    const timer = intervalMs > 0 ? setInterval(() => { void refresh(); }, intervalMs) : undefined;
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    if (intervalMs > 0) document.addEventListener("visibilitychange", visible);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const expires = new Date(notice.endsAt).getTime();
    const timer = setTimeout(() => setNotice(current => current && new Date(current.endsAt).getTime() <= Date.now() ? null : current ? { ...current } : null), Math.min(Math.max(0, expires - Date.now()), 2147483647));
    return () => clearTimeout(timer);
  }, [notice]);
  if (!notice || new Date(notice.endsAt) <= new Date()) return null;
  return <aside role="status" aria-live="polite" data-scheduled-update className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[130] flex max-h-[40dvh] w-[calc(100%-2rem)] max-w-xl gap-3 overflow-y-auto rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg print:hidden"><CalendarClock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Scheduled EstateDesk update</p><p className="mt-1 text-sm font-medium">{formatUpdateTime(notice.startsAt)} – {formatUpdateTime(notice.endsAt)}</p><p className="mt-2 text-sm leading-6">{notice.message}</p></div></aside>;
}
