"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

export function OrganizationFeatureToggle({ label, enabled, locked = false }: { label: string; enabled: boolean; locked?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" role="switch" aria-label={label} aria-checked={enabled} aria-busy={pending} disabled={locked || pending}
    className="inline-flex min-h-11 min-w-28 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">
    {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <span aria-hidden="true" className={`flex h-6 w-10 items-center rounded-full p-0.5 ${enabled ? "bg-emerald-600" : "bg-slate-500"}`}><span className={`size-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`} /></span>}
    {pending ? "Saving…" : enabled ? "On" : "Off"}
  </button>;
}
