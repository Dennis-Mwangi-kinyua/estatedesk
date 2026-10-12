"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrgRole } from "@prisma/client";
import { ORG_PERMISSIONS, roleHasOrgPermission } from "@/lib/permissions/role-matrix";
import { ORG_PERMISSION_LABELS } from "@/lib/permissions/permission-labels";
import { updateStaffMandates } from "../actions/update-staff-mandates";
export function StaffMandatesForm({ membershipId, role, grants }: { membershipId: string; role: OrgRole; grants: string[] }) {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return <form className="space-y-5" onSubmit={event => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setNotice(""); setError("");
    start(async () => { try { const result = await updateStaffMandates(form); if (!result.ok) setError(result.error || "Could not save permissions."); else { setNotice("Staff permissions updated. Changes apply on the next request."); router.refresh(); } } catch { setError("Could not save staff permissions. Refresh and try again."); } });
  }}><input type="hidden" name="membershipId" value={membershipId} />
    <fieldset><legend className="mb-4 text-lg font-semibold">Additional powers and approval mandates</legend><div className="grid gap-3 md:grid-cols-2">{ORG_PERMISSIONS.filter(permission => permission !== "caretaker.fieldwork").map(permission => {
      const inherited = roleHasOrgPermission(role, permission);
      return <label key={permission} className="flex min-h-16 items-start gap-3 rounded-2xl border border-border bg-muted/20 p-4"><input name="permissions" type="checkbox" value={permission} defaultChecked={inherited || grants.includes(permission)} disabled={inherited || pending} className="mt-1 size-4 shrink-0" /><span className="text-sm font-medium">{ORG_PERMISSION_LABELS[permission]}{inherited && <span className="mt-1 block text-xs font-normal text-muted-foreground">Included with this role</span>}</span></label>;
    })}</div></fieldset>
    <label className="grid gap-2 text-sm font-medium">Reason for the change<textarea name="note" required maxLength={1000} rows={3} className="rounded-xl border border-border bg-background p-3" /></label>
    <p className="text-sm leading-6 text-muted-foreground">Uncheck an additional permission to revoke it. Staff keep the standard permissions of their role. Only organisation admins can assign mandates or grant admin status.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm">{notice}</p>}
    <button disabled={pending} className="min-h-11 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Saving…" : "Save staff permissions"}</button>
  </form>;
}
