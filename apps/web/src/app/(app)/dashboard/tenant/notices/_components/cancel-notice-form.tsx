"use client";

import { useId, useState, useTransition } from "react";
import { withdrawMoveOutNotice } from "../actions";

export function CancelNoticeForm({ noticeId, inspectionScheduled }: { noticeId: string; inspectionScheduled: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const headingId = useId();

  if (!confirming) return <div className="mt-3 space-y-2">
    <p className="text-xs text-muted-foreground">Changed your plans? You can cancel this move-out notice and keep your lease active.</p>
    <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-xl border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive">Cancel move-out notice</button>
  </div>;

  return <form className="mt-3 space-y-3 rounded-xl border border-border bg-card p-4" aria-labelledby={headingId} onSubmit={event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    start(async () => {
      try {
        const result = await withdrawMoveOutNotice(form);
        if (!result.ok) { setError(result.error); return; }
        window.location.assign("/dashboard/tenant/notices?success=notice_withdrawn");
      } catch {
        setError("We could not cancel your notice. Please try again.");
      }
    });
  }}>
    <input name="noticeId" type="hidden" value={noticeId} />
    <h3 id={headingId} className="text-sm font-semibold">Cancel this move-out notice?</h3>
    <p className="text-sm text-muted-foreground">Your lease will stay active.{inspectionScheduled ? " Your scheduled move-out inspection will also be cancelled." : " You can submit a new notice later if your plans change."}</p>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <div className="flex flex-wrap gap-2">
      <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Cancelling notice…" : "Yes, cancel notice"}</button>
      <button type="button" disabled={pending} onClick={() => { setConfirming(false); setError(""); }} className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-medium">Keep notice</button>
    </div>
  </form>;
}
