"use client";

import { useActionState, type ReactNode } from "react";

export function MessageActionButton({ action, messageId, children, confirm, danger = false }: {
  action: (data: FormData) => Promise<void>; messageId: string; children: ReactNode; confirm?: string; danger?: boolean;
}) {
  const [feedback, formAction, pending] = useActionState<{ error?: string; success?: boolean }, FormData>(async (_previous, data) => {
    try { await action(data); return { success: true }; }
    catch { return { error: "Could not update this message. Please try again." }; }
  }, {});
  return <form action={formAction} onSubmit={event => { if (pending || (confirm && !window.confirm(confirm))) event.preventDefault(); }}>
    <input name="messageId" type="hidden" value={messageId} />
    <button type="submit" disabled={pending} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 ${danger ? "border-red-500/20 text-red-700 hover:bg-red-500/5 dark:text-red-300" : "border-border bg-card text-foreground hover:bg-muted"}`}>{pending ? "Updating…" : children}</button>
    {feedback.error && <p role="alert" className="mt-2 max-w-52 text-xs text-red-600 dark:text-red-300">{feedback.error}</p>}
    {feedback.success && <span role="status" className="sr-only">Message updated.</span>}
  </form>;
}
