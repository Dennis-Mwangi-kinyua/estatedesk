"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { scheduleInspectionAction } from "@/app/(app)/move-outs/_lib/actions";
export function ScheduleForm({ noticeId, reschedule = false, inspectors }: { noticeId: string; reschedule?: boolean; inspectors: { id: string; label: string }[] }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return <form className="grid gap-2" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); setError(""); start(async () => { try { const result = await scheduleInspectionAction(form); if (!result.ok) { setError(result.error); return; } router.refresh(); } catch { setError("The inspection could not be scheduled. Please try again."); } }); }}><input name="noticeId" type="hidden" value={noticeId} /><label className="grid gap-1 text-xs">Inspection date and time (Nairobi)<input type="datetime-local" name="scheduledAt" required className="min-h-10 rounded-xl border border-border bg-background px-3 text-sm" /></label><label className="grid gap-1 text-xs">Inspector<select name="inspectorUserId" required defaultValue="" className="min-h-10 rounded-xl border border-border bg-background px-3 text-sm"><option value="" disabled>Choose scoped staff member</option>{inspectors.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>{error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}<button type="submit" disabled={pending} className="min-h-10 rounded-xl bg-primary px-3 text-sm text-primary-foreground">{pending ? "Saving…" : reschedule ? "Reschedule inspection" : "Schedule inspection"}</button></form>;
}
