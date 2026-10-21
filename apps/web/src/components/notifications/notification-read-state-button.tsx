"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { acknowledgeNotification } from "@/lib/notifications/acknowledge";

export function NotificationReadStateButton({ notificationId, isRead }: { notificationId: string; isRead: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function update() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await acknowledgeNotification({ id: notificationId, read: !isRead });
      router.refresh();
    } catch {
      setError("Could not update this notification. Try again.");
    } finally {
      setPending(false);
    }
  }

  return <span className="inline-flex w-full flex-col gap-1 sm:w-auto">
    <button type="button" onClick={update} disabled={pending} aria-label={isRead ? "Mark notification unread" : "Mark notification read"} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted/40 disabled:opacity-60 sm:w-auto">
      {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : isRead ? "Mark unread" : "Mark read"}
    </button>
    {error ? <span role="alert" className="text-xs text-destructive">{error}</span> : null}
  </span>;
}
