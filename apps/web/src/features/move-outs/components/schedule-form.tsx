"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, UserRound } from "lucide-react";
import { scheduleInspectionAction } from "@/app/(app)/move-outs/_lib/actions";

export function ScheduleForm({
  noticeId,
  reschedule = false,
  inspectors,
}: {
  noticeId: string;
  reschedule?: boolean;
  inspectors: { id: string; label: string }[];
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <form className="mt-4 space-y-4 rounded-2xl border border-border bg-background p-4 sm:p-5" onSubmit={event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setError("");
      start(async () => {
        try {
          const result = await scheduleInspectionAction(form);
          if (!result.ok) { setError(result.error); return; }
          router.refresh();
        } catch {
          setError("The inspection could not be scheduled. Please try again.");
        }
      });
    }}>
      <input name="noticeId" type="hidden" value={noticeId} />
      <div><h5 className="text-sm font-semibold text-foreground">{reschedule ? "Update inspection appointment" : "Plan an inspection"}</h5><p className="mt-1 text-sm leading-5 text-muted-foreground">Choose a time and the staff member responsible for the visit. Same-day inspections are allowed.</p></div>
      <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground"><span className="flex items-center gap-2"><CalendarClock aria-hidden="true" className="size-4 text-muted-foreground" />Date and time <span className="font-normal text-muted-foreground">(Nairobi)</span></span><input type="datetime-local" name="scheduledAt" required className="min-h-12 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm" /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground"><span className="flex items-center gap-2"><UserRound aria-hidden="true" className="size-4 text-muted-foreground" />Assigned inspector</span><select name="inspectorUserId" required defaultValue="" className="min-h-12 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm"><option value="" disabled>Choose scoped staff member</option>{inspectors.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      {error ? <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</p> : null}
      <button type="submit" disabled={pending} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60">{pending ? "Saving appointment…" : reschedule ? "Save new appointment" : "Schedule inspection"}</button>
    </form>
  );
}
