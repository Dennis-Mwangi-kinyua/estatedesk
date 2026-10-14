"use client";
import { startTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { publishUpdateNotice, withdrawUpdateNotice } from "./actions";
import { formatUpdateTime, type UpdateNotice } from "./policy";

export function UpdateNoticeForm({ current }: { current: UpdateNotice | null }) {
  const [state, publish, pending] = useActionState(publishUpdateNotice, {});
  const [withdrawState, withdraw, withdrawing] = useActionState(withdrawUpdateNotice, {});
  const router = useRouter();
  useEffect(() => { if (state.message || withdrawState.message) router.refresh(); }, [state.message, withdrawState.message, router]);
  return <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6" aria-labelledby="scheduled-updates-title">
    <h2 id="scheduled-updates-title" className="text-xl font-semibold">Scheduled platform updates</h2>
    <p className="mt-2 text-sm text-muted-foreground">Notify everyone before an update. Times use East Africa Time (UTC+3). The notice appears immediately and expires when the update window ends.</p>
    {current ? <div className="mt-4 rounded-xl border border-border bg-muted p-4"><p className="font-semibold">Current notice: {formatUpdateTime(current.startsAt)}</p><p className="mt-1 text-sm">{current.message}</p><button type="button" onClick={() => startTransition(() => withdraw(new FormData()))} disabled={pending || withdrawing} className="mt-3 min-h-11 rounded-xl border border-border bg-background px-4 text-sm font-semibold">{withdrawing ? "Withdrawing…" : "Withdraw notice"}</button></div> : null}
    <form action={publish} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Update date and time (EAT)<input required type="datetime-local" name="startsAt" defaultValue={current ? new Date(new Date(current.startsAt).getTime() + 3 * 3600000).toISOString().slice(0, 16) : undefined} className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-foreground" /></label>
      <label className="text-sm font-medium">Expected duration (minutes)<input required type="number" name="duration" min={1} max={1440} defaultValue={current ? Math.round((new Date(current.endsAt).getTime() - new Date(current.startsAt).getTime()) / 60000) : 30} className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-foreground" /></label>
      <label className="text-sm font-medium sm:col-span-2">Message to users<textarea required name="message" minLength={10} maxLength={1000} rows={3} defaultValue={current?.message ?? "EstateDesk will be updated during this window. Please save your work before the update begins."} className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-foreground" /></label>
      <button disabled={pending || withdrawing} className="min-h-11 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground sm:col-span-2">{pending ? "Publishing…" : current ? "Replace update notice" : "Notify users of scheduled update"}</button>
    </form>
    {state.error ? <p role="alert" className="mt-3 text-sm text-destructive">{state.error}</p> : null}
    {state.message || withdrawState.message ? <p role="status" className="mt-3 text-sm text-foreground">{withdrawState.message || state.message}</p> : null}
  </section>;
}
