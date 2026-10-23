import { getReviewQueue } from "@/lib/workflow/review-queue";
import { ReviewQueue } from "@/components/shared/review-queue";
import Link from "@/components/navigation/workspace-link";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { ProviderDirectory, type DirectoryParams } from "@/features/providers/directory";
import { ActionForm, Field, TextField, CategoryField, panelClass, inputClass } from "@/features/providers/forms";
import { createJob, hireForJob, completeJob, cancelJob, reportHiredProvider, reviewProviderJobApplication, recordProviderJobPayment, resolveProviderJobPayment } from "@/features/providers/actions";

export const dynamic = "force-dynamic";

const applicationStatusLabel: Record<string, string> = {
  PENDING: "New application", REVIEWING: "Under review", SELECTED: "Offer sent",
  DECLINED: "Declined", WITHDRAWN: "Withdrawn", CANCELLED: "Job cancelled",
};

function ApplicationStatus({ status }: { status: string }) {
  const selected = status === "SELECTED";
  const tone = selected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border bg-muted text-muted-foreground";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{applicationStatusLabel[status] ?? status.replaceAll("_", " ")}</span>;
}

export default async function Page({ searchParams }: { searchParams: Promise<DirectoryParams & { workflow?: string }> }) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
  const filters = await searchParams;
  const workflow = ["open", "applications", "active", "completion", "payments"].includes(filters.workflow ?? "") ? filters.workflow : undefined;
  const workflowWhere = workflow === "open" ? { status: "OPEN" as const } : workflow === "applications" ? { status: "OPEN" as const, applications: { some: { status: { in: ["PENDING", "REVIEWING"] as ("PENDING" | "REVIEWING")[] } } } } : workflow === "active" ? { status: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED"] as ("ASSIGNED" | "IN_PROGRESS" | "SUBMITTED")[] } } : workflow === "completion" ? { status: "SUBMITTED" as const } : workflow === "payments" ? { payments: { some: { status: "DISPUTED" as const } } } : {};
  const queues = await getReviewQueue(session, "organization");
  const jobs = await prisma.serviceJob.findMany({
    where: { orgId: session.activeOrgId!, ...workflowWhere },
    include: {
      provider: { select: { id: true, businessName: true, status: true } },
      applications: { include: { provider: { select: { id: true, businessName: true, location: true, status: true, available: true, user: { select: { emailVerified: true } } } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
      review: true,
      reports: { select: { id: true, resolvedAt: true } },
      payments: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const [open, activeWork] = await Promise.all([
    prisma.serviceJob.count({ where: { orgId: session.activeOrgId!, status: "OPEN" } }),
    prisma.serviceJob.count({ where: { orgId: session.activeOrgId!, status: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED"] } } }),
  ]);
  const awaitingReview = queues.find(group => group.id === "applications")?.total ?? 0;

  return (
    <main className="space-y-8 p-4 sm:p-6">
      <header className={`${panelClass} bg-gradient-to-br from-card to-primary/5`}>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">EstateDesk marketplace</p>
        <h1 className="mt-2 text-3xl font-bold">Service providers & jobs</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Publish a clear scope, review proposals, send an offer, and track work through completion. Payment stays between your organisation and the provider. You can optionally record direct payments here so both sides can confirm the history.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:max-w-3xl md:grid-cols-3">
          <Link href="?workflow=open#jobs" className="rounded-xl border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Open jobs</p><p className="mt-1 text-2xl font-bold">{open}</p></Link>
          <Link href="?workflow=applications#jobs" className="rounded-xl border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Applications to review</p><p className="mt-1 text-2xl font-bold">{awaitingReview}</p></Link>
          <Link href="?workflow=active#jobs" className="rounded-xl border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Active work</p><p className="mt-1 text-2xl font-bold">{activeWork}</p></Link>
        </div>
      </header>

      <ReviewQueue groups={queues} summaryOnly />

      <section className={panelClass}>
        <details>
          <summary className="cursor-pointer text-xl font-bold">Post a service job</summary>
          <div className="mt-5 max-w-2xl">
            <p className="mb-4 text-sm text-muted-foreground">Include measurable work, the property area, access requirements, and a realistic budget range. Don’t include private tenant information.</p>
            <ActionForm action={createJob} label="Publish job">
              <Field name="title" label="Job title" maxLength={120} />
              <CategoryField />
              <Field name="location" label="Job location / area" />
              <TextField name="description" label="Scope of work" />
              <Field name="budget" label="Indicative budget in KES (optional)" type="number" required={false} />
              <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm"><input className="mt-1" type="checkbox" name="paymentTracking" /><span><strong>Track payments in EstateDesk (optional)</strong><span className="mt-1 block text-muted-foreground">Money is still sent directly to the provider. EstateDesk records entries and provider confirmation; it does not collect, hold, or transfer funds.</span></span></label>
              <Field name="agreedAmount" label="Agreed total in KES (optional; for tracking only)" type="number" required={false} />
              <p className="text-sm text-muted-foreground">Only providers approved by EstateDesk can apply. Providers see the job scope and location, but not private property access details.</p>
            </ActionForm>
          </div>
        </details>
      </section>

      <section id="jobs" aria-labelledby="jobs-title">
        {workflow ? <Link href="/dashboard/org/service-providers#jobs" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">Show all jobs</Link> : null}
        <p className="mb-2 text-xs text-muted-foreground">Most recent {jobs.length} matching jobs shown.</p>
        <div className="mb-4"><p className="text-sm font-semibold uppercase tracking-wide text-primary">Your activity</p><h2 id="jobs-title" className="mt-1 text-2xl font-bold">Jobs and applications</h2></div>
        <div className="space-y-4">
          {jobs.map(job => <article id={`job-${job.id}`} key={job.id} className={panelClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-sm font-semibold text-primary">{job.category} · {job.location} · {job.status.replaceAll("_", " ")}</p><h3 className="mt-2 text-xl font-bold">{job.title}</h3></div>
              {!(["COMPLETED", "CANCELLED"].includes(job.status)) ? <ActionForm action={cancelJob} label="Cancel job" danger><input type="hidden" name="jobId" value={job.id} /></ActionForm> : null}
            </div>
            <p className="mt-3 whitespace-pre-line text-muted-foreground">{job.description}</p>
            {job.budget ? <p className="mt-2 text-sm font-medium">Indicative budget: KES {job.budget.toNumber().toLocaleString("en-KE")}</p> : null}
            {job.paymentTracking && job.provider ? <section className="mt-5 rounded-xl border border-border bg-muted/40 p-4" aria-label="Payment tracking"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-semibold">Direct payment record</h4><p className="mt-1 text-xs text-muted-foreground">EstateDesk records the transfer reported by your organisation. The provider confirms or queries it; funds do not pass through EstateDesk.</p></div><p className="text-sm font-semibold">{job.agreedAmount ? `Agreed: KES ${job.agreedAmount.toNumber().toLocaleString("en-KE")}` : "No agreed total set"}</p></div><p className="mt-3 text-sm">Recorded (excluding voided): KES {job.payments.filter(payment => payment.status !== "VOIDED").reduce((sum, payment) => sum + payment.amount.toNumber(), 0).toLocaleString("en-KE")} · {job.payments.filter(payment => payment.status === "RECORDED").length} awaiting provider · {job.payments.filter(payment => payment.status === "DISPUTED").length} queried</p>{job.status !== "CANCELLED" ? <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-primary">Record a direct payment</summary><div className="mt-3"><ActionForm action={recordProviderJobPayment} label="Save payment record"><input type="hidden" name="jobId" value={job.id} /><Field name="amount" label="Amount paid (KES)" type="number" /><label className="block text-sm font-medium">Payment method<select name="method" className={inputClass}><option value="MPESA">M-Pesa</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CASH">Cash</option><option value="OTHER">Other</option></select></label><Field name="reference" label="Transaction reference (optional)" required={false} maxLength={160} /><TextField name="note" label="Payment note (optional)" required={false} maxLength={1000} /></ActionForm></div></details> : null}{job.payments.length ? <ul className="mt-4 space-y-3">{job.payments.map(payment => <li key={payment.id} className="rounded-lg border border-border bg-background p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">KES {payment.amount.toNumber().toLocaleString("en-KE")} · {payment.method.replaceAll("_", " ").toLowerCase()}</p><span className="text-xs font-semibold">{payment.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-xs text-muted-foreground">Recorded {payment.createdAt.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })}{payment.reference ? ` · Ref ${payment.reference}` : ""}</p>{payment.note ? <p className="mt-2 text-sm">{payment.note}</p> : null}{payment.providerResponseNote ? <p className="mt-2 rounded bg-muted p-2 text-sm">Provider response: {payment.providerResponseNote}</p> : null}{payment.resolutionNote ? <p className="mt-2 rounded bg-muted p-2 text-sm">Resolution: {payment.resolutionNote}</p> : null}{payment.status === "DISPUTED" ? <div className="mt-3 grid gap-3 md:grid-cols-2"><ActionForm action={resolveProviderJobPayment} label="Confirm after review"><input type="hidden" name="paymentId" value={payment.id} /><input type="hidden" name="status" value="CONFIRMED" /><TextField name="resolutionNote" label="Resolution and evidence reviewed" maxLength={1000} /></ActionForm><ActionForm action={resolveProviderJobPayment} label="Void this record" danger><input type="hidden" name="paymentId" value={payment.id} /><input type="hidden" name="status" value="VOIDED" /><TextField name="resolutionNote" label="Reason for voiding this record" maxLength={1000} /></ActionForm></div> : null}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No payments recorded yet.</p>}</section> : null}
            {job.provider ? <p className="mt-3 rounded-lg bg-muted p-3 font-semibold">Selected provider: {job.provider.status === "ACTIVE" ? <Link className="text-primary underline" href={`/service-providers/${job.provider.id}`}>{job.provider.businessName}</Link> : `${job.provider.businessName} (${job.provider.status.toLowerCase()})`}</p> : null}

            {job.applications.length ? <section className="mt-5 border-t border-border pt-4"><h4 className="mb-3 font-semibold">Provider applications ({job.applications.length})</h4><div className="grid gap-3 xl:grid-cols-2">{job.applications.map(application => <article key={application.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><Link className="font-semibold text-primary underline" href={`/service-providers/${application.provider.id}`}>{application.provider.businessName}</Link><p className="text-sm text-muted-foreground">{application.provider.location} · {application.provider.status === "ACTIVE" ? "Approved" : application.provider.status.toLowerCase()}</p></div><ApplicationStatus status={application.status} /></div>
              <p className="my-3 whitespace-pre-line text-sm">{application.message}</p>
              {application.reviewNote ? <p className="mb-3 rounded-lg bg-muted p-3 text-sm">Previous note: {application.reviewNote}</p> : null}
              {job.status === "OPEN" && ["PENDING", "REVIEWING"].includes(application.status) ? <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ActionForm action={reviewProviderJobApplication} label="Mark under review"><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="status" value="REVIEWING" /><Field name="reviewNote" label="Optional note" required={false} maxLength={1000} /></ActionForm>
                  <ActionForm action={reviewProviderJobApplication} label="Decline with feedback" danger><input type="hidden" name="applicationId" value={application.id} /><input type="hidden" name="status" value="DECLINED" /><TextField name="reviewNote" label="Feedback for the provider (at least 10 characters)" maxLength={1000} /></ActionForm>
                </div>
                {application.provider.status === "ACTIVE" && application.provider.available && application.provider.user.emailVerified ? <ActionForm action={hireForJob} label="Send job offer"><input type="hidden" name="jobId" value={job.id} /><input type="hidden" name="providerId" value={application.provider.id} /></ActionForm> : <p className="text-xs text-muted-foreground">This provider is not currently eligible for a job offer.</p>}
              </div> : null}
            </article>)}</div></section> : job.status === "OPEN" ? <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">No applications yet. Matching available providers have been notified.</p> : null}

            {job.status === "SUBMITTED" ? <div className="mt-5 max-w-xl rounded-xl border border-sky-500/30 bg-sky-500/5 p-4"><h4 className="font-semibold">Provider submitted work</h4><p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{job.completionNotes}</p><div className="mt-4"><ActionForm action={completeJob} label="Confirm completion & publish review"><input type="hidden" name="jobId" value={job.id} /><label className="block text-sm">Rating<select name="rating" className={inputClass}>{[5, 4, 3, 2, 1].map(rating => <option key={rating} value={rating}>{rating} / 5</option>)}</select></label><TextField name="comment" label="Public review of the completed work" maxLength={2000} /></ActionForm></div></div> : null}
            {job.review ? <p className="mt-4 rounded-lg bg-muted p-3 text-sm">Your public review: {job.review.rating}/5 · {job.review.comment}</p> : null}
            {job.provider && !["CANCELLED"].includes(job.status) ? <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold text-destructive">Report this provider to EstateDesk</summary><div className="mt-3 max-w-xl"><ActionForm action={reportHiredProvider} label="Submit report" danger><input type="hidden" name="jobId" value={job.id} /><TextField name="reason" label="Describe the problem (at least 20 characters)" /><p className="text-sm text-muted-foreground">Reports go to platform staff and are not published on the provider’s profile.</p></ActionForm>{job.reports.some(report => !report.resolvedAt) ? <p className="mt-2 text-sm">A report for this job is awaiting platform review.</p> : null}</div></details> : null}
          </article>)}
          {!jobs.length ? <p className={panelClass}>No jobs yet. Post a clear scope of work to receive proposals from approved providers.</p> : null}
        </div>
        {jobs.length === 100 ? <p className="mt-4 text-xs text-muted-foreground">Showing the latest 100 jobs.</p> : null}
      </section>

      <section aria-labelledby="directory-title"><div className="mb-4"><p className="text-sm font-semibold uppercase tracking-wide text-primary">Discover local talent</p><h2 id="directory-title" className="mt-1 text-2xl font-bold">Approved provider directory</h2><p className="mt-1 text-muted-foreground">Compare portfolios and verified completed-job reviews before sending an offer.</p></div><ProviderDirectory filters={await searchParams} orgView /></section>
    </main>
  );
}
