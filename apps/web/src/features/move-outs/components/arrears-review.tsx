"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideArrearsApproval } from "../arrears-approval-actions";
export function ArrearsReview({ noticeId, requestId }: { noticeId: string; requestId: string }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return <form className="space-y-4" onSubmit={event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    start(async () => { try { const result = await decideArrearsApproval(form); if (!result.ok) setError(result.error || "Could not save decision."); else router.refresh(); } catch { setError("Could not save decision. Please try again."); } });
  }}><input type="hidden" name="noticeId" value={noticeId} /><input type="hidden" name="requestId" value={requestId} />
    <label className="grid gap-2 text-sm">Approval decision<select name="decision" className="min-h-11 rounded-xl border border-border bg-background p-3"><option value="APPROVED">Approve handover with remaining arrears</option><option value="REJECTED">Reject request</option></select></label>
    <label className="grid gap-2 text-sm">Review note<textarea name="reason" required maxLength={2000} rows={3} className="rounded-xl border border-border bg-background p-3" /></label>
    <p className="text-sm text-muted-foreground">Approval permits handover. The outstanding debt remains recorded and collectible.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <button disabled={pending} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">{pending ? "Saving…" : "Save approval decision"}</button>
  </form>;
}
