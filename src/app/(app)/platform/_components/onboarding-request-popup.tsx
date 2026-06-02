"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";

type OnboardingRequestPopupProps = {
  count: number;
  latestRequestId: string | null;
  latestCompany: string | null;
};

export function OnboardingRequestPopup({
  count,
  latestRequestId,
  latestCompany,
}: OnboardingRequestPopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (count <= 0 || !latestRequestId) return;

    const storageKey = `platform-onboarding-popup:${latestRequestId}`;
    if (window.localStorage.getItem(storageKey) === "dismissed") return;

    const timer = window.setTimeout(() => setOpen(true), 300);
    return () => window.clearTimeout(timer);
  }, [count, latestRequestId]);

  function dismiss() {
    if (latestRequestId) {
      window.localStorage.setItem(
        `platform-onboarding-popup:${latestRequestId}`,
        "dismissed",
      );
    }
    setOpen(false);
  }

  if (!open || count <= 0 || !latestRequestId) return null;

  return (
    <div className="fixed inset-x-3 top-3 z-50 mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:top-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <Bell className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            New onboarding request
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {latestCompany ?? "A new lead"} is waiting for platform follow-up.
            {count > 1 ? ` There are ${count} new requests in total.` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/platform/onboarding?status=NEW"
              onClick={dismiss}
              className="inline-flex min-h-9 items-center rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Review now
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss onboarding request alert"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
