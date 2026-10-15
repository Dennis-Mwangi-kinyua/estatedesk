"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { acknowledgeNotification } from "@/lib/notifications/acknowledge";
import { LoaderCircle } from "lucide-react";

type NotificationReadButtonProps =
  | {
      notificationId: string;
      all?: false;
      children?: ReactNode;
      className?: string;
    }
  | {
      notificationId?: never;
      all: true;
      children?: ReactNode;
      className?: string;
    };

export function NotificationReadButton({
  notificationId,
  all = false,
  children,
  className,
}: NotificationReadButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  async function markRead() {
    if (pending || complete) return;
    setPending(true);
    setError("");

    try {
      await acknowledgeNotification(all ? { all: true } : { id: notificationId! });
      setComplete(true);
      router.refresh();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to mark notifications as read. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (complete) return null;

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        data-workspace-action="true"
        type="button"
        onClick={markRead}
        disabled={pending}
        className={
          className ??
          "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground transition hover:bg-muted/30 disabled:cursor-wait disabled:opacity-60"
        }
      >
        {pending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Updating…
          </>
        ) : (
          children ?? (all ? "Mark all read" : "Mark read")
        )}
      </button>
      {error ? (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </span>
  );
}
