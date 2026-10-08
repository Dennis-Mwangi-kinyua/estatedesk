"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NotificationViewButton({ notificationId, href, all = false, children = "View", className, onViewed }: {
  notificationId?: string; href?: string; all?: boolean; children?: React.ReactNode; className?: string; onViewed?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function view() {
    if (pending) return;
    setPending(true); setError("");
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(all ? { all: true } : { id: notificationId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      onViewed?.();
      window.dispatchEvent(new Event("estatedesk:notifications-read"));
      const destination = all ? href : result.actionUrl;
      if (destination) router.push(destination);
      router.refresh();
    } catch { setError("Could not clear the notification. Please try again."); }
    finally { setPending(false); }
  }
  return <span className="inline-flex flex-col gap-1"><button data-workspace-action="true" type="button" onClick={view} disabled={pending} className={className ?? "rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium"}>{pending ? "Opening…" : children}</button>{error ? <span role="alert" className="text-xs text-destructive">{error}</span> : null}</span>;
}
