"use client";

import { useActionState, useState } from "react";
import { APP_PLANS, type AppPlan } from "@/lib/billing/plans";
import { ORG_VIEW_LABELS, type OrgView } from "@/lib/permissions/org-role-policy";
import type { OrganizationPlanPolicy } from "@/lib/billing/organization-plan-policy";
import { saveOrganizationPlan } from "./plan-action";

export function OrganizationPlanForm({ orgId, plan: initialPlan, policy, revision }: { orgId: string; plan: AppPlan; policy: OrganizationPlanPolicy | null; revision: string }) {
  const [plan, setPlan] = useState(initialPlan);
  const [state, action, pending] = useActionState(saveOrganizationPlan, {});
  const configured = policy?.plan === plan ? policy : null;
  const limits = configured ?? APP_PLANS[plan];
  const field = "min-h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground";
  return <form action={action} className="space-y-5 p-5">
    <input type="hidden" name="orgId" value={orgId} /><input type="hidden" name="revision" value={revision} />
    <label className="block space-y-2 text-sm font-medium">Plan<select name="plan" value={plan} onChange={event => setPlan(event.target.value as AppPlan)} className={field}>{Object.entries(APP_PLANS).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}</select></label>
    <div key={`${plan}:${revision}`} className="grid gap-4 sm:grid-cols-3">{([['propertiesLimit', 'Properties'], ['unitsLimit', 'Units and BnB listings'], ['usersLimit', 'Internal users']] as const).map(([name, label]) => <label key={name} className="block space-y-2 text-sm font-medium">{label}<input name={name} type="number" min={0} max={1000000} step={1} defaultValue={limits[name] === Number.MAX_SAFE_INTEGER || limits[name] === null ? "" : limits[name]} className={field} /></label>)}</div>
    <p className="text-sm text-muted-foreground">Limits apply only to this organization. Blank means unlimited. Lowering a limit preserves existing records and blocks further additions above the limit.</p>
    {plan === "ENTERPRISE" ? <fieldset key={revision} className="space-y-3 rounded-xl border border-border p-4"><legend className="px-2 font-semibold">Custom plan sections</legend><p className="text-sm text-muted-foreground">Choose what this organization can access. Individual role restrictions still apply.</p><div className="grid gap-3 sm:grid-cols-2">{Object.entries(ORG_VIEW_LABELS).map(([view, label]) => <label key={view} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="allowedViews" value={view} defaultChecked={!configured?.allowedViews || configured.allowedViews.includes(view as OrgView)} />{label}</label>)}</div></fieldset> : null}
    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="reset" />Reset to the selected plan’s standard limits and access</label>
    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="confirmed" required />I confirm these plan, capacity and access changes.</label>
    <p className="text-sm text-muted-foreground">Saving does not renew or activate an inactive subscription.</p>
    <button type="submit" disabled={pending} className="min-h-11 rounded-lg bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : "Save organization plan"}</button>
    {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}{state.success ? <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{state.success}</p> : null}
  </form>;
}
