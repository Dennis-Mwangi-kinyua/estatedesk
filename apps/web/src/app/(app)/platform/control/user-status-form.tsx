"use client";

import { useActionState } from "react";
import type { RecipientMessageDraft } from "@/lib/notifications/recipient-message";
import { RecipientMessageShare } from "@/components/shared/recipient-message-share";
import { forceUserStatusDraftAction } from "./actions";

export function UserStatusForm() {
  const [state, action, pending] = useActionState<{ draft?: RecipientMessageDraft }, FormData>(async (_previous, data) => forceUserStatusDraftAction(data), {});
  return <div className="space-y-4"><form action={action} className="space-y-3 rounded-xl border border-border p-4">
    <h3 className="text-sm font-semibold text-foreground">Set user status</h3>
    <label className="block text-sm text-foreground">Registered email, username, or ID<input name="identifier" required className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-base" /></label>
    <label className="block text-sm text-foreground">Status<select name="status" defaultValue="SUSPENDED" className="mt-2 min-h-11 w-full rounded-xl border border-border px-3 text-base"><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="DISABLED">Disabled</option></select></label>
    <label className="block text-sm text-foreground">Reason (optional)<textarea name="reason" maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-border p-3 text-base" /></label>
    <button disabled={pending} type="submit" data-workspace-action="true" className="min-h-11 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Updating…" : "Apply status"}</button>
  </form>{state.draft && <><p role="status" className="text-sm font-medium text-foreground">Account status updated. Prepare the notice below.</p><RecipientMessageShare draft={state.draft} title="Share account status notice" /></>}</div>;
}
