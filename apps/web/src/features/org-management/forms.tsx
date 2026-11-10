"use client";
import { useActionState, useState, type ReactNode } from "react";
import { managementAction } from "./actions";
import { field } from "./ui";
export function ActionForm({ operation, id, children, label = "Save" }: { operation: string; id?: string; children?: ReactNode; label?: string }) {
  const [state, action, pending] = useActionState(managementAction, {});
  return <form action={action} className="space-y-3"><input type="hidden" name="operation" value={operation} />{id && <input type="hidden" name="id" value={id} />}{children}{state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}{state.message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{state.message}</p>}<button disabled={pending} className="min-h-11 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Saving…" : label}</button></form>;
}
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-1 text-sm font-medium">{label}{children}</label>; }
export function Note({ name = "note", label = "Review note" }: { name?: string; label?: string }) { return <Field label={label}><textarea name={name} required minLength={3} maxLength={2000} className={field} rows={3} /></Field>; }
export type TargetOption = { id: string; label: string };
export function ApprovalRequestForm({ targets }: { targets: Record<string, TargetOption[]> }) {
  const [kind, setKind] = useState("EXPENSE");
  return <ActionForm operation="requestApproval" label="Request approval"><Field label="Request type"><select className={field} name="kind" value={kind} onChange={e => setKind(e.target.value)}><option value="EXPENSE">Organization expense</option><option value="REFUND">Deposit refund authorization</option><option value="RENT_CHANGE">Change future monthly rent</option><option value="WRITE_OFF">Write off an outstanding charge</option><option value="STAFF_ACCESS">Suspend staff membership</option></select></Field><Field label="Record to review"><select key={kind} name="targetId" required className={field}><option value="">Choose a record</option>{targets[kind].map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select></Field>{["RENT_CHANGE", "WRITE_OFF"].includes(kind) ? <Field label={kind === "RENT_CHANGE" ? "New monthly rent" : "Amount to write off"}><input className={field} name="amount" type="number" step="0.01" min="0.01" max="9999999999.99" required /></Field> : <input type="hidden" name="amount" value="" />}<Note name="reason" label="Reason for the request" /><p className="text-sm text-muted-foreground">A different authorized person must review your request. Refund approval authorizes the refund; record the actual payment and proof in the move-out workflow. Rent changes affect newly issued bills; existing charges keep their amounts.</p></ActionForm>;
}
