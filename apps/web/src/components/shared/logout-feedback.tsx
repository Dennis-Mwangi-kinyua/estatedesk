"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, LogOut } from "lucide-react";
import { clearLogoutCacheWithin } from "@/lib/auth/logout-cache";

type LogoutState = { scope: "user" | "guest"; error?: string };

/** Lives above workspace drawers so closing a mobile menu cannot hide progress. */
export function LogoutFeedback() {
  const [state, setState] = useState<LogoutState | null>(null);
  const busy = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const retry = useRef<() => void>(() => {});

  useEffect(() => {
    const start = async (scope: "user" | "guest") => {
      if (busy.current) return;
      busy.current = true;
      setState({ scope });
      retry.current = () => { void start(scope); };
      try {
        const cleanup = clearLogoutCacheWithin(window);
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "X-EstateDesk-Logout": "1" },
          body: JSON.stringify({ scope }),
          signal: AbortSignal.timeout(20000),
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Logout failed");
        await cleanup;
        // A full document replacement discards the authenticated router cache.
        window.location.replace(scope === "guest" ? "/guest-stay" : "/login");
      } catch {
        busy.current = false;
        setState({ scope, error: "We could not confirm logout. Check your connection and try again." });
      }
    };
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.hasAttribute("data-logout-form")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void start(form.dataset.logoutScope === "guest" ? "guest" : "user");
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  useEffect(() => {
    if (!state) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const siblings = Array.from(document.body.children).filter((node): node is HTMLElement => node instanceof HTMLElement && !node.hasAttribute("data-logout-overlay"));
    const previousInert = siblings.map((node) => node.inert);
    siblings.forEach((node) => { node.inert = true; });
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" && event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "Escape" && state.error) { setState(null); return; }
      const buttons = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
      if (!buttons.length) { panel.current?.focus(); return; }
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      buttons[(index + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      siblings.forEach((node, index) => { node.inert = previousInert[index]; });
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [state]);

  if (!state) return null;
  return createPortal(
    <div data-logout-overlay className="fixed inset-0 z-[20000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-description" aria-busy={!state.error} className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center text-card-foreground shadow-2xl outline-none">
        {state.error ? <LogOut aria-hidden="true" className="mx-auto h-9 w-9 text-red-600 dark:text-red-400" /> : <Loader2 aria-hidden="true" className="mx-auto h-9 w-9 animate-spin text-red-600 motion-reduce:animate-none dark:text-red-400" />}
        <h2 id="logout-title" className="mt-5 text-xl font-semibold">{state.error ? "Logout interrupted" : "Logging out…"}</h2>
        <p id="logout-description" role={state.error ? "alert" : "status"} className="mt-3 text-sm leading-6 text-muted-foreground">{state.error ?? "Ending your session securely. Please wait."}</p>
        {state.error && <div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => retry.current()} className="min-h-11 rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500">Try again</button><button type="button" onClick={() => setState(null)} className="min-h-11 rounded-lg border border-border px-4 font-semibold focus-visible:ring-2 focus-visible:ring-ring">Close</button></div>}
      </div>
    </div>, document.body,
  );
}
