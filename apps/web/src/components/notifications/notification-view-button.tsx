"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, X } from "lucide-react";

type NotificationViewButtonProps = {
  notificationId?: string;
  href?: string;
  title?: string;
  message?: string;
  all?: boolean;
  children?: ReactNode;
  className?: string;
  onViewedAction?: () => void;
};

export function NotificationViewButton({
  notificationId,
  href,
  title,
  message,
  all = false,
  children = "View",
  className,
  onViewedAction,
}: NotificationViewButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const hasMessage = Boolean(title || message);

  async function acknowledge(refresh = true) {
    const response = await fetch("/api/notifications/read", {
      signal: AbortSignal.timeout(12_000),
      keepalive: true,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(all ? { all: true } : { id: notificationId }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
          : "The notification could not be marked as read.",
      );
    }

    window.dispatchEvent(new Event("estatedesk:notifications-read"));
    if (refresh) router.refresh();
    return result.actionUrl as string | null;
  }

  async function view() {
    if (pending) return;
    setPending(true);
    setError("");

    if (!all && hasMessage) {
      setOpen(true);
      try {
        await acknowledge(false);
      } catch {
        setError("The message is open, but it could not be marked as read. Please retry.");
      } finally {
        setPending(false);
      }
      return;
    }

    const opened = !all && Boolean(href);
    if (opened) router.push(href!);

    try {
      const actionUrl = await acknowledge();
      onViewedAction?.();
      const destination = all ? href : href ?? actionUrl;
      if (destination && !opened) router.push(destination);
    } catch {
      setError(
        opened
          ? "The page opened, but the notification could not be marked as read. Please retry when your connection is stable."
          : "The notification could not be opened. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  function closeMessage() {
    setOpen(false);
    setError("");
    onViewedAction?.();
    router.refresh();
  }

  const messageDialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:py-6">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="notification-detail-title"
              className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl shrink-0 overflow-y-auto rounded-3xl border border-border bg-card p-5 text-foreground shadow-2xl sm:max-h-[min(90dvh,48rem)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Notification
                  </p>
                  <h2
                    id="notification-detail-title"
                    className="mt-2 break-words text-xl font-semibold tracking-tight sm:text-2xl"
                  >
                    {title ?? "Notification"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeMessage}
                  disabled={pending}
                  aria-label="Close notification"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-foreground/90">
                {message || "There is no additional message content."}
              </div>

              {error ? (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                {href ? (
                  <Link
                    href={href}
                    onClick={() => onViewedAction?.()}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    Open related page
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={closeMessage}
                  disabled={pending}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
                >
                  Close
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <span className="inline-flex flex-col gap-1">
        <button
          data-workspace-action="true"
          type="button"
          onClick={view}
          disabled={pending}
          className={
            className ??
            "rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium"
          }
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Opening…
            </span>
          ) : (
            children
          )}
        </button>
        {error && !open ? (
          <span role="alert" className="text-xs text-destructive">
            {error}
          </span>
        ) : null}
      </span>

      {messageDialog}
    </>
  );
}
