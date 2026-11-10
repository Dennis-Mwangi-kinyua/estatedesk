import Link from "next/link";
import { redirect } from "next/navigation";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { loadSetupProgress } from "@/lib/workflow/load-setup-progress";
import { SetupChecklist } from "../_components/setup-checklist";
export const dynamic="force-dynamic";
export default async function Page() {
  const session=await requireManagementAccess();
  if(session.membershipScope?.scopeType!=="ORG"||!canAccessWorkspacePath(session,"/dashboard/org/imports"))redirect("/access-denied");
  const setup=await loadSetupProgress(session.activeOrgId!);const done=setup.steps.filter(s=>s.done).length;
  return <div className="mx-auto min-w-0 max-w-4xl space-y-5 pb-24"><header className="rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-primary">Guided portfolio setup</p><h1 className="mt-3 text-3xl font-semibold">From your spreadsheet to your first collection</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">Add a small sample of your portfolio, confirm the records, and issue your first bill. Setup progress comes from your actual workspace records.</p><p className="mt-4 text-sm font-semibold">{done} of {setup.steps.length} steps complete</p><progress aria-label="Portfolio setup progress" value={done} max={setup.steps.length} className="mt-2 h-3 w-full accent-emerald-600"/></header><section className="rounded-2xl border bg-card p-5"><h2 className="text-xl font-semibold">Already have an Excel or Google Sheets portfolio?</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7"><li>Export each sheet as CSV. Start with properties, then units, then tenants.</li><li>Use the matching template and keep property names and unit numbers consistent.</li><li>Validate the exact CSV, resolve row errors, then review and confirm the import.</li><li>Review tenant leases and initial charges before sending reminders. Imported tenant records do not create login credentials.</li></ol><Link href="/dashboard/org/imports" className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground sm:w-auto">Start a guided import</Link></section><SetupChecklist steps={setup.steps}/><Link href="/dashboard/org/collections" className="inline-flex min-h-12 items-center font-semibold underline">Open Collections today →</Link></div>;
}
