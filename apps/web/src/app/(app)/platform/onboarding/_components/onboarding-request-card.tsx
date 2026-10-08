"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { ArrowRight, Building2, CheckCircle2, Mail, Phone, Trash2 } from "lucide-react";
import { deleteOnboardingRequestAction, quickUpdateOnboardingStatusAction, updateOnboardingRequestAction } from "../actions";

export type OnboardingRequestCardData = {
  id: string; companyName: string; fullName: string; workEmail: string; phone: string | null;
  managedPropertyType: string; status: string; message: string | null; internalNotes: string | null;
  commissionRate?: string | null; createdAt: string; handledAt: string | null; handledBy: string | null; referral: string | null;
};
const statuses = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED", "REJECTED"];
const labels: Record<string, string> = { NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", CLOSED: "Closed", REJECTED: "Rejected" };
const nextSteps: Record<string, string> = { NEW: "Contact the applicant to understand their portfolio and requirements.", CONTACTED: "Confirm their requirements and qualify the request for setup.", QUALIFIED: "Create the organisation using the applicant’s details.", CLOSED: "This request is closed. Review the notes if further follow-up is needed.", REJECTED: "This request was rejected. Review the notes before reopening." };
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50";

function ActionForm({ action, requestId, status, confirm, children, className = "", success = "Request updated." }: {
  action: (data: FormData) => Promise<void>; requestId: string; status?: string; confirm?: string;
  children: ReactNode; className?: string; success?: string;
}) {
  const [feedback, formAction, pending] = useActionState<{ error?: string; success?: string }, FormData>(async (_previous: { error?: string; success?: string }, data: FormData) => {
    try { await action(data); return { success }; }
    catch { return { error: "The request could not be updated. Please try again." }; }
  }, {});
  return <form action={formAction} className={className} data-confirm={confirm} onSubmit={event => { if (pending) event.preventDefault(); }}>
    <input type="hidden" name="requestId" value={requestId} />
    {status && <input type="hidden" name="status" value={status} />}
    <fieldset disabled={pending} className="min-w-0 space-y-3">{children}</fieldset>
    {pending && <p role="status" className="mt-2 text-xs text-muted-foreground">Saving…</p>}
    {feedback.error && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-300">{feedback.error}</p>}
    {feedback.success && <p role="status" className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{feedback.success}</p>}
  </form>;
}

export function OnboardingRequestCard({ request }: { request: OnboardingRequestCardData }) {
  const date = new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" });
  return <article className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-labelledby={`request-${request.id}`}>
    <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
      <div className="min-w-0 space-y-4">
        <div><div className="flex flex-wrap items-center gap-2"><h2 id={`request-${request.id}`} className="break-words text-lg font-semibold">{request.companyName}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${request.status === "NEW" ? "bg-amber-500/10 text-amber-800 dark:text-amber-200" : request.status === "QUALIFIED" ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200" : "bg-muted text-muted-foreground"}`}>{labels[request.status] ?? request.status}</span></div><p className="mt-1 text-sm text-muted-foreground">{request.fullName} · Requested {date.format(new Date(request.createdAt))}</p></div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2"><div className="min-w-0"><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-1 break-all">{request.workEmail}</dd></div><div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="mt-1 break-words">{request.phone || "Not provided"}</dd></div><div><dt className="text-xs text-muted-foreground">Portfolio type</dt><dd className="mt-1 break-words">{request.managedPropertyType}</dd></div>{request.referral && <div><dt className="text-xs text-muted-foreground">Referral</dt><dd className="mt-1 break-words">{request.referral}</dd></div>}{request.commissionRate && <div><dt className="text-xs text-muted-foreground">Referral commission</dt><dd className="mt-1">{request.commissionRate}%</dd></div>}</dl>
        {request.message && <div className="rounded-xl bg-muted/40 p-3"><h3 className="text-xs font-semibold text-muted-foreground">Applicant’s message</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{request.message}</p></div>}
        <p className="text-xs text-muted-foreground">{request.handledBy ? `Last handled by ${request.handledBy}${request.handledAt ? ` · ${date.format(new Date(request.handledAt))}` : ""}` : "No team member has handled this request yet."}</p>
      </div>
      <div className="min-w-0 space-y-3 rounded-xl border border-border bg-muted/20 p-4"><h3 className="text-sm font-semibold">Next action</h3><p className="text-sm leading-6 text-muted-foreground">{nextSteps[request.status] ?? "Review this request."}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1"><a className={buttonClass} href={`mailto:${encodeURIComponent(request.workEmail)}?subject=${encodeURIComponent("Your EstateDesk onboarding request")}`}><Mail className="h-4 w-4" />Email applicant</a>{request.phone && <a className={buttonClass} href={`tel:${request.phone.replace(/[^+0-9]/g, "")}`}><Phone className="h-4 w-4" />Call applicant</a>}</div>
        {request.status === "NEW" && <ActionForm action={quickUpdateOnboardingStatusAction} requestId={request.id} status="CONTACTED"><button data-workspace-action="true" className={`${buttonClass} w-full border-primary/30 text-primary`}><CheckCircle2 className="h-4 w-4" />Mark contacted</button></ActionForm>}
        {request.status === "CONTACTED" && <ActionForm action={quickUpdateOnboardingStatusAction} requestId={request.id} status="QUALIFIED"><button data-workspace-action="true" className={`${buttonClass} w-full border-primary/30 text-primary`}><CheckCircle2 className="h-4 w-4" />Mark qualified</button></ActionForm>}
        {request.status === "QUALIFIED" && <Link data-workspace-action="true" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href={`/platform/organizations/new?requestId=${encodeURIComponent(request.id)}`}><Building2 className="h-4 w-4" />Create organisation<ArrowRight className="h-4 w-4" /></Link>}
      </div>
    </div>
    <details className="border-t border-border"><summary className="cursor-pointer px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary sm:px-5">Manage status and team notes{request.internalNotes ? " · Notes saved" : ""}</summary><div className="grid gap-4 px-4 pb-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto]">
      <ActionForm action={updateOnboardingRequestAction} requestId={request.id} className="min-w-0"><label className="block text-sm font-medium">Request status<select name="status" defaultValue={request.status} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-card px-3">{statuses.map(status => <option key={status} value={status}>{labels[status]}</option>)}</select></label><label className="block text-sm font-medium">Team notes<textarea name="internalNotes" defaultValue={request.internalNotes || ""} rows={3} placeholder="Record requirements, contact attempts, or the reason for closing." className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2 font-normal" /></label><button data-workspace-action="true" className={buttonClass}><CheckCircle2 className="h-4 w-4" />Save changes</button></ActionForm>
      <div className="border-t border-border pt-4 lg:max-w-56 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0"><h3 className="text-sm font-semibold">Delete request</h3><p className="mb-3 mt-1 text-xs leading-5 text-muted-foreground">Permanently removes this request and its notes. To keep a record, change its status to Closed or Rejected.</p><ActionForm action={deleteOnboardingRequestAction} requestId={request.id} confirm={`Permanently delete the onboarding request for ${request.companyName}? This cannot be undone.`} success="Request deleted."><button data-workspace-action="true" className={`${buttonClass} border-red-500/30 text-red-700 dark:text-red-300`}><Trash2 className="h-4 w-4" />Delete request</button></ActionForm></div>
    </div></details>
  </article>;
}
