"use client";

import { requestPlanUpgradeFromWorkspaceAction } from "@/features/settings/actions/settings-actions";

export function PlanLimitUpgrade({ message }: { message: string | null | undefined }) {
  if (!message || !message.includes("plan allows")) return null;
  return (
    <form action={requestPlanUpgradeFromWorkspaceAction} className="mt-3 grid gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm leading-6">{message}</p>
      <p className="text-sm text-muted-foreground">Paid plans are reviewed after payment. Submit the request from here.</p>
      <label className="text-sm font-medium">Requested plan
        <select name="requestedPlan" defaultValue="PRO" className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3">
          <option value="PRO">Pro</option>
          <option value="PLUS">Plus</option>
          <option value="ENTERPRISE">Custom</option>
        </select>
      </label>
      <label className="text-sm font-medium">Payment reference (optional)
        <input name="paymentReference" maxLength={80} className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3" placeholder="M-Pesa code or bank reference" />
      </label>
      <label className="text-sm font-medium">Notes (optional)
        <input name="upgradeNotes" maxLength={500} className="mt-1 block h-11 w-full rounded-xl border border-border bg-background px-3" placeholder="Portfolio size or a phone number" />
      </label>
      <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Submit upgrade request</button>
    </form>
  );
}
