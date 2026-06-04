"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { completedLabel, getQueryMessageType } from "@/lib/action-feedback";

type ToastState = {
  type: "pending" | "success" | "error";
  title: string;
  detail?: string;
};

const STORAGE_KEY = "estatedesk:last-action";
const REFRESH_INTERVAL_MS = 45_000;
const MIN_REFRESH_GAP_MS = 12_000;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function inferActionLabel(form: HTMLFormElement, submitter: HTMLElement | null) {
  const submitterText = submitter ? normalizeText(submitter.textContent ?? "") : "";
  const formText = normalizeText(form.getAttribute("aria-label") ?? "");
  const text = submitterText || formText || "Action";
  const lower = text.toLowerCase();

  if (lower.includes("delete") || lower.includes("remove")) return "Deleting";
  if (lower.includes("archive")) return "Archiving";
  if (lower.includes("restore") || lower.includes("reactivate")) return "Restoring";
  if (lower.includes("reject")) return "Rejecting";
  if (lower.includes("approve") || lower.includes("verify")) return "Approving";
  if (lower.includes("send")) return "Sending";
  if (lower.includes("mark")) return "Updating";
  if (lower.includes("logout") || lower.includes("log out")) return "Logging out";
  if (lower.includes("save") || lower.includes("update")) return "Saving";
  if (lower.includes("create") || lower.includes("add")) return "Creating";

  return text.length > 24 ? "Working" : text;
}


function isServerActionForm(form: HTMLFormElement) {
  if (form.method.toLowerCase() === "get") return false;

  try {
    const formData = new FormData(form);
    return Array.from(formData.keys()).some((key) => String(key).startsWith("$ACTION"));
  } catch {
    return form.method.toLowerCase() === "post";
  }
}

function getStoredAction(): { label: string; path: string; at: number } | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { label: string; path: string; at: number };
  } catch {
    return null;
  }
}

function clearStoredAction() {
  window.sessionStorage.removeItem(STORAGE_KEY);
}


export function AppActionFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lastRefreshAt = useRef(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const locationKey = useMemo(
    () => `${pathname}?${searchParams.toString()}`,
    [pathname, searchParams],
  );
  const message = useMemo(() => searchParams.get("message"), [searchParams]);
  const messageType = useMemo(
    () => getQueryMessageType(searchParams.get("messageType")),
    [searchParams],
  );
  const hasError = useMemo(() => {
    for (const key of searchParams.keys()) {
      if (key.toLowerCase().endsWith("error")) return true;
    }
    return messageType === "error";
  }, [searchParams, messageType]);
  const refreshEnabled = pathname !== "/change-password";

  useEffect(() => {
    const stored = getStoredAction();
    if (!stored || message || hasError) return;
    if (Date.now() - stored.at < 400) return;

    const timer = window.setTimeout(() => {
      setToast({
        type: "success",
        title: `${completedLabel(stored.label)} successfully`,
        detail: "The page has been refreshed with the latest information.",
      });
      clearStoredAction();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [locationKey, message, hasError]);

  useEffect(() => {
    if (!message) return;

    setToast({
      type: messageType,
      title: message,
    });
    clearStoredAction();

    const params = new URLSearchParams(searchParams.toString());
    params.delete("message");
    params.delete("messageType");
    const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(url);
  }, [message, messageType, pathname, router, searchParams]);

  useEffect(() => {
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!isServerActionForm(form)) return;

      const submitter =
        event.submitter instanceof HTMLElement ? event.submitter : null;
      const label = inferActionLabel(form, submitter);

      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ label, path: locationKey, at: Date.now() }),
      );

      setToast({
        type: "pending",
        title: `${label}...`,
        detail: "Please wait while EstateDesk updates the records.",
      });
    };

    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [locationKey]);

  useEffect(() => {
    if (!refreshEnabled) return;

    const refresh = (force = false) => {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (!force && now - lastRefreshAt.current < MIN_REFRESH_GAP_MS) return;

      lastRefreshAt.current = now;
      router.refresh();
    };

    const intervalRefresh = () => refresh(true);
    const passiveRefresh = () => refresh();

    const interval = window.setInterval(intervalRefresh, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", passiveRefresh);
    document.addEventListener("visibilitychange", passiveRefresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", passiveRefresh);
      document.removeEventListener("visibilitychange", passiveRefresh);
    };
  }, [refreshEnabled, router]);

  useEffect(() => {
    if (!toast || toast.type === "pending") return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const Icon =
    toast.type === "pending" ? Loader2 : toast.type === "success" ? CheckCircle2 : XCircle;

  return (
    <div className="fixed top-4 left-3 right-3 z-[80] mx-auto max-w-md sm:top-6 sm:left-auto sm:right-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <Icon className={`h-5 w-5 ${toast.type === "pending" ? "animate-spin" : ""}`} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              {toast.title}
            </p>
            {toast.detail ? (
              <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                {toast.detail}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
