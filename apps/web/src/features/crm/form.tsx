"use client";
import { useActionState, type ReactNode } from "react";
import type { CrmState } from "./actions";

export function CrmForm({ action, children, submit = "Save", className = "" }: { action: (state: CrmState, form: FormData) => Promise<CrmState>; children: ReactNode; submit?: string; className?: string }) {
  const [state, run, pending] = useActionState(async (previous: CrmState, form: FormData) => {
    for (const key of ["demoAt", "dueAt"]) {
      const date = form.get(key);
      if (typeof date === "string" && date) form.set(key, new Date(`${date}+03:00`).toISOString());
    }
    return action(previous, form);
  }, { ok: false, message: "" });
  return <form action={run} className={`space-y-3 ${className}`}>
    <fieldset disabled={pending} className="contents">
      {children}
      <button type="submit" className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : submit}</button>
    </fieldset>
    {state.message && <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p>}
  </form>;
}
export function DateField({ name, initial, id }: { name: string; initial?: string | null; id?: string }) {
  const local = initial ? new Date(new Date(initial).getTime() + 3 * 60 * 60 * 1000) : null;
  const date = local ? local.toISOString().slice(0, 16) : "";
  return <input id={id} type="datetime-local" name={name} defaultValue={date} className="min-h-11 w-full rounded-lg border border-border bg-background px-3" />;
}
