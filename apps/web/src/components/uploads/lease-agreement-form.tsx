"use client";
import { useActionState } from "react";
import { saveLeaseAgreement } from "@/app/(app)/dashboard/org/leases/[leaseId]/agreement-actions";
export function LeaseAgreementForm({ leaseId, title, landlordName, terms, hasContract, canEdit }: { leaseId: string; title: string; landlordName: string; terms: string; hasContract: boolean; canEdit: boolean }) {
  const [state, action, pending] = useActionState(saveLeaseAgreement, { message: "" });
  return <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
    <h2 className="text-lg font-semibold">Lease agreement</h2>
    <p className="text-sm text-muted-foreground">Create an agreement using this lease’s tenant, unit, rent, deposit, and dates. Customize the parties and terms before saving. Saved agreements are available to management and the tenant.</p>
    {hasContract ? <a href={`/dashboard/org/leases/${leaseId}/download`} className="inline-block font-medium text-primary underline">Download current agreement</a> : null}
    {canEdit ? <form action={action} className="space-y-3">
      <input type="hidden" name="leaseId" value={leaseId} />
      <label className="block text-sm">Agreement title<input name="title" defaultValue={title} maxLength={150} required className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
      <label className="block text-sm">Landlord / lessor name<input name="landlordName" defaultValue={landlordName} maxLength={200} required className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
      <label className="block text-sm">Terms and conditions<textarea name="terms" defaultValue={terms} rows={14} maxLength={20000} required className="mt-1 w-full rounded-lg border bg-background p-3" /></label>
      <p className="text-xs text-muted-foreground">{hasContract ? "Saving creates a new agreement and replaces the current downloadable contract. Previous versions are retained." : "Review the terms and complete the property-specific details before saving."}</p>
      <button disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">{pending ? "Saving…" : "Save agreement and generate PDF"}</button>
    </form> : null}
    <p role="status" className="text-sm">{state.message}</p>
  </section>;
}
