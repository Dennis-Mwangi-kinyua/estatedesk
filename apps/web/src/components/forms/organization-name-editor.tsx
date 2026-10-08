"use client";

import { useActionState, useId, useState } from "react";
import { LoaderCircle, Pencil } from "lucide-react";
import type { OrganizationNameState } from "@/features/organizations/actions/rename-organization";

export function OrganizationNameEditor({ name, orgId, action }: { name: string; orgId?: string; action: (state: OrganizationNameState, formData: FormData) => Promise<OrganizationNameState> }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const id = useId();
  return <div className="rounded-xl border border-border bg-muted/15 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">Organisation name</p><p className="mt-1 break-words font-semibold text-foreground">{state.name ?? name}</p></div>{!editing && <button type="button" onClick={()=>setEditing(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground"><Pencil aria-hidden="true" className="h-4 w-4"/>Edit name</button>}</div>
    {editing && <form action={formAction} className="mt-4 space-y-3">
      {orgId && <input type="hidden" name="orgId" value={orgId}/>}
      <label htmlFor={id} className="block text-sm font-medium text-foreground">New organisation name</label>
      <input id={id} name="organizationName" defaultValue={state.name ?? name} required minLength={2} maxLength={200} autoFocus disabled={pending} aria-describedby={`${id}-help`} className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"/>
      <p id={`${id}-help`} className="text-xs leading-5 text-muted-foreground">This is the name displayed throughout your workspace.</p>
      <div className="flex flex-wrap gap-2"><button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin"/>}{pending ? "Saving…" : "Save name"}</button><button type="button" disabled={pending} onClick={()=>setEditing(false)} className="min-h-12 rounded-xl border border-border px-4 text-sm font-medium text-foreground">{state.status === "success" ? "Done" : "Cancel"}</button></div>
    </form>}
    {state.message && <p role={state.status === "error" ? "alert" : "status"} className={`mt-3 text-sm ${state.status === "error" ? "text-destructive" : "text-emerald-700 dark:text-emerald-300"}`}>{state.message}</p>}
  </div>;
}
