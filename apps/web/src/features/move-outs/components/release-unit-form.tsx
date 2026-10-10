"use client";

import { useState, useTransition } from "react";
import { releaseMoveOutUnitAction } from "@/app/(app)/move-outs/_lib/actions";

export function ReleaseUnitForm({ noticeId }: { noticeId: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  if (done) return <p className="mt-2 text-xs" role="status">Unit is vacant and ready to let.</p>;
  return <form className="mt-2 text-xs" onSubmit={event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    start(async () => {
      try { await releaseMoveOutUnitAction(form); setDone(true); }
      catch (failure) { setError(failure instanceof Error ? failure.message : "Could not release this unit."); }
    });
  }}>
    <input name="noticeId" type="hidden" value={noticeId} />
    <label className="flex gap-2"><input type="checkbox" className="mt-0.5 size-4 shrink-0" name="readyConfirmed" required />Repairs and cleaning completed; unit ready to let.</label>
    {error ? <p role="alert" className="mt-2 text-destructive">{error}</p> : null}
    <button type="submit" disabled={pending} className="mt-2 min-h-11 w-full rounded-xl border px-3 py-2 sm:w-auto">{pending ? "Releasing unit…" : "Mark unit vacant and ready"}</button>
  </form>;
}
