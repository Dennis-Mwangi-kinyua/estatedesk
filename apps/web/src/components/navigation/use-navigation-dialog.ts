"use client";

import { useEffect, type RefObject } from "react";

/** Shared keyboard and scroll behavior for mobile navigation drawers. */
export function useNavigationDialog(open: boolean, panel: RefObject<HTMLElement | null>, close: () => void, desktopWidth = 1024) {
  useEffect(() => {
    if (!open || !panel.current) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const dialog = panel.current;
    const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex="0"]')).filter((element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0);
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => (dialog.querySelector<HTMLElement>('[aria-label="Close navigation"], [aria-label="Close menu"]') ?? controls()[0] ?? dialog).focus(), 0);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key !== "Tab") return;
      const elements = controls();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
    const desktop = window.matchMedia(`(min-width: ${desktopWidth}px)`);
    const onResize = () => { if (desktop.matches) close(); };
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onResize);
    onResize();
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onResize);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [open, panel, close, desktopWidth]);
}
