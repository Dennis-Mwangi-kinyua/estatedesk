"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

type RegisterStatusToastProps = {
  message: {
    tone: "success" | "warning";
    title: string;
    text: string;
  } | null;
};

export function RegisterStatusToast({ message }: RegisterStatusToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("request");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, 8500);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  if (!message || !visible) return null;

  const isSuccess = message.tone === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;

  return (
    <div className="fixed inset-x-3 top-16 z-50 flex justify-center sm:inset-x-auto sm:right-5 sm:top-5 sm:block">
      <div
        role={isSuccess ? "status" : "alert"}
        aria-live={isSuccess ? "polite" : "assertive"}
        className={`w-full max-w-md rounded-xl border bg-white p-4 shadow-2xl shadow-neutral-950/12 ${
          isSuccess ? "border-emerald-200" : "border-amber-200"
        }`}
      >
        <div className="flex gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              isSuccess
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-950">
              {message.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              {message.text}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Dismiss notification"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
