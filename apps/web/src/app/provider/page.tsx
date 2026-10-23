import type { Metadata } from "next";
import Link from "next/link";
import { ProfileAvatar } from "@/components/uploads/profile-avatar";
import { ProfilePictureProvider } from "@/components/uploads/profile-picture-context";
import { ProductUpdatesBanner } from "@/features/updates/banner";
import { prisma } from "@/lib/prisma";
import { requireProvider } from "@/features/providers/access";
import { ActionForm, Field, TextField, CategoryField, ProfileFields, ProviderPresence, panelClass } from "@/features/providers/forms";
import { saveProvider, addPortfolio, deletePortfolio, applyToJob, withdrawApplication, declineJobOffer, updateProviderJob, respondToProviderJobPayment } from "@/features/providers/actions";
import { SERVICE_CATEGORIES } from "@/features/providers/policy";
import { logoutAction } from "@/features/auth/actions/logout-action";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My provider portal | EstateDesk", robots: { index: false, follow: false } };

const statusLabel: Record<string, string> = {
  PENDING: "Awaiting review",
  REVIEWING: "Under review",
  SELECTED: "Offer received",
  DECLINED: "Not selected",
  WITHDRAWN: "Withdrawn",
  CANCELLED: "Job cancelled",
};

function StatusBadge({ status }: { status: string }) {
  const tone = status === "SELECTED" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : status === "DECLINED" || status === "CANCELLED" ? "border-border bg-muted text-muted-foreground"
      : "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{statusLabel[status] ?? status.replaceAll("_", " ")}</span>;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ category?: string; location?: string }> }) {
  const { session, provider } = await requireProvider();
  const picture = await prisma.user.findUniqueOrThrow({ where: { id: session.userId }, select: { profileImageUrl: true } });
  const filters = await searchParams;
  const category = SERVICE_CATEGORIES.find(value => value === filters.category);
  const location = typeof filters.location === "string" ? filters.location.trim().slice(0, 160) : "";
  const [projects, assignedJobs, openJobs, applications, reviews, updates] = await Promise.all([
    prisma.providerPortfolio.findMany({ where: { providerId: provider.id }, orderBy: { createdAt: "desc" } }),
    prisma.serviceJob.findMany({ where: { providerId: provider.id }, include: { org: { select: { name: true } }, review: true, payments: { orderBy: { createdAt: "desc" } } }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.serviceJob.findMany({ where: { status: "OPEN", org: { status: "ACTIVE", deletedAt: null }, ...(category ? { category } : {}), ...(location ? { location: { contains: location, mode: "insensitive" } } : {}) }, include: { org: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.jobApplication.findMany({ where: { providerId: provider.id }, include: { job: { select: { id: true, title: true, location: true, status: true, org: { select: { name: true } } } } }, orderBy: { updatedAt: "desc" }, take: 50 }),
    prisma.providerReview.aggregate({ where: { providerId: provider.id }, _avg: { rating: true }, _count: true }),
    prisma.notification.findMany({ where: { userId: session.userId, channel: "IN_APP", providerResponse: { path: ["source"], equals: "service-provider-marketplace" } }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const applicationMap = new Map(applications.map(application => [application.jobId, application]));
  const pendingWork = assignedJobs.filter(job => ["ASSIGNED", "IN_PROGRESS", "SUBMITTED"].includes(job.status)).length;
  const canApply = provider.status === "ACTIVE" && provider.available && pendingWork === 0;

  return (
    <ProfilePictureProvider url={picture.profileImageUrl}>
      <div className="min-h-dvh bg-background text-foreground">
        <ProviderPresence />
        <header className="border-b border-border bg-card/95">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="/" className="font-bold tracking-tight text-primary">EstateDesk <span className="font-normal text-muted-foreground">· Provider workspace</span></Link>
            <nav aria-label="Provider navigation" className="flex flex-wrap items-center gap-3 text-sm">
              <Link href="/service-providers" className="rounded-lg px-3 py-2 hover:bg-muted">Browse directory</Link>
              <Link href="/profile" aria-label="Manage profile picture" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary"><ProfileAvatar name={session.fullName} /></Link>
              <form data-logout-form action={logoutAction}><button className="min-h-10 rounded-lg border border-border px-3 py-2 font-semibold">Log out</button></form>
            </nav>
          </div>
        </header>
        <ProductUpdatesBanner userId={session.userId} audience="PROVIDER" />
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
          <section className={`${panelClass} overflow-hidden bg-gradient-to-br from-card via-card to-primary/5`}>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xl font-bold text-primary"><ProfileAvatar name={session.fullName} /></div>
                <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Provider workspace</p><h1 className="mt-1 text-3xl font-bold">Welcome, {session.fullName}</h1><p className="mt-1 text-muted-foreground">{provider.businessName} · {provider.category} · {provider.location}</p></div>
              </div>
              <Link href={`/service-providers/${provider.id}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground">View public profile</Link>
            </div>
            {provider.status === "FLAGGED" ? <p role="alert" className="mt-5 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm">Your profile is under platform review and hidden from the directory. You can continue existing work, but new hiring is paused.</p> : null}
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Rating</p><p className="mt-1 text-2xl font-bold">{reviews._avg.rating ? `${reviews._avg.rating.toFixed(1)} / 5` : "New"}</p><p className="text-xs text-muted-foreground">{reviews._count} confirmed reviews</p></div>
              <div className="rounded-xl border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Completed work</p><p className="mt-1 text-2xl font-bold">{assignedJobs.filter(job => job.status === "COMPLETED").length}</p><p className="text-xs text-muted-foreground">Confirmed by organisations</p></div>
              <div className="rounded-xl border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Applications</p><p className="mt-1 text-2xl font-bold">{applications.filter(application => ["PENDING", "REVIEWING"].includes(application.status)).length}</p><p className="text-xs text-muted-foreground">Waiting for a response</p></div>
              <div className="rounded-xl border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Active work</p><p className="mt-1 text-2xl font-bold">{pendingWork}</p><p className="text-xs text-muted-foreground">Offers and jobs in progress</p></div>
            </div>
          </section>

          {updates.length ? <section className={panelClass} aria-labelledby="updates-title"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Marketplace inbox</p><h2 id="updates-title" className="mt-1 text-xl font-bold">Recent updates</h2></div><span className="text-xs text-muted-foreground">Latest {updates.length}</span></div><div className="mt-4 grid gap-3 md:grid-cols-2">{updates.map(update => <article key={update.id} className="rounded-xl border border-border p-4"><h3 className="font-semibold">{update.title}</h3><p className="mt-1 text-sm text-muted-foreground">{update.message}</p><time className="mt-2 block text-xs text-muted-foreground" dateTime={update.createdAt.toISOString()}>{update.createdAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</time></article>)}</div></section> : null}

          <section aria-labelledby="applications-title">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Your proposals</p><h2 id="applications-title" className="mt-1 text-2xl font-bold">My applications</h2></div><p className="text-sm text-muted-foreground">Track reviews, offers, and outcomes from organisations.</p></div>
            <div className="grid gap-4 lg:grid-cols-2">{applications.map(application => <article key={application.id} className={panelClass}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-primary">{application.job.org.name} · {application.job.location}</p><h3 className="mt-1 text-lg font-bold">{application.job.title}</h3></div><StatusBadge status={application.status} /></div><p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{application.message}</p>{application.reviewNote ? <p className="mt-3 rounded-lg bg-muted p-3 text-sm">Organisation feedback: {application.reviewNote}</p> : null}{application.status === "SELECTED" ? <p className="mt-3 text-sm font-medium">Offer received. Review it under My jobs and accept to start work.</p> : null}{application.status === "PENDING" || application.status === "REVIEWING" ? <ActionForm action={withdrawApplication} label="Withdraw application" danger><input type="hidden" name="applicationId" value={application.id} /></ActionForm> : null}</article>)}</div>
            {!applications.length ? <p className={panelClass}>No applications yet. Browse matching jobs and send a short proposal explaining your availability and relevant experience.</p> : null}
          </section>

          <section aria-labelledby="jobs-title"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Work pipeline</p><h2 id="jobs-title" className="mt-1 text-2xl font-bold">My jobs</h2></div><p className="text-sm text-muted-foreground">Keep the organisation updated as work progresses.</p></div><div className="grid gap-4 lg:grid-cols-2">{assignedJobs.map(job => <article className={panelClass} key={job.id}><p className="text-sm font-semibold text-primary">{job.org.name} · {job.location} · {job.status.replaceAll("_", " ")}</p><h3 className="mt-2 text-xl font-bold">{job.title}</h3><p className="my-3 whitespace-pre-line text-muted-foreground">{job.description}</p>{job.budget ? <p className="mb-3 text-sm">Indicative budget: KES {job.budget.toNumber().toLocaleString("en-KE")}</p> : null}{job.status === "ASSIGNED" ? <div className="grid gap-3 sm:grid-cols-2"><ActionForm action={updateProviderJob} label="Accept offer & start"><input type="hidden" name="jobId" value={job.id} /><input type="hidden" name="operation" value="accept" /></ActionForm><ActionForm action={declineJobOffer} label="Decline offer" danger><input type="hidden" name="jobId" value={job.id} /></ActionForm></div> : null}{job.status === "IN_PROGRESS" ? <ActionForm action={updateProviderJob} label="Submit completed work"><input type="hidden" name="jobId" value={job.id} /><input type="hidden" name="operation" value="submit" /><TextField name="completionNotes" label="Work completed and handover notes" /></ActionForm> : null}{job.status === "SUBMITTED" ? <p className="rounded-lg bg-sky-500/10 p-3 text-sm">Submitted for review. The organisation will confirm completion and leave a review.</p> : null}{job.review ? <p className="rounded-xl bg-muted p-3">Rated {job.review.rating}/5: {job.review.comment}</p> : null}{job.paymentTracking ? <section className="mt-4 rounded-xl border border-border bg-muted/40 p-4"><h4 className="font-semibold">Payment history</h4><p className="mt-1 text-xs text-muted-foreground">These entries are reported by the organisation. Money moves directly between you and the organisation; EstateDesk does not receive or hold it.</p>{job.agreedAmount ? <p className="mt-2 text-sm">Agreed total: KES {job.agreedAmount.toNumber().toLocaleString("en-KE")}</p> : null}{job.payments.length ? <ul className="mt-3 space-y-3">{job.payments.map(payment => <li key={payment.id} className="rounded-lg border border-border bg-background p-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">KES {payment.amount.toNumber().toLocaleString("en-KE")} · {payment.method.replaceAll("_", " ").toLowerCase()}</p><span className="text-xs font-semibold">{payment.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-xs text-muted-foreground">Reported {payment.createdAt.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })}{payment.reference ? ` · Ref ${payment.reference}` : ""}</p>{payment.note ? <p className="mt-2 text-sm">{payment.note}</p> : null}{payment.status === "RECORDED" ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><ActionForm action={respondToProviderJobPayment} label="Confirm received"><input type="hidden" name="paymentId" value={payment.id} /><input type="hidden" name="status" value="CONFIRMED" /></ActionForm><ActionForm action={respondToProviderJobPayment} label="Report a problem" danger><input type="hidden" name="paymentId" value={payment.id} /><input type="hidden" name="status" value="DISPUTED" /><TextField name="responseNote" label="Explain the issue (at least 10 characters)" maxLength={1000} /></ActionForm></div> : null}{payment.providerResponseNote ? <p className="mt-2 rounded bg-muted p-2 text-sm">Your response: {payment.providerResponseNote}</p> : null}{payment.resolutionNote ? <p className="mt-2 rounded bg-muted p-2 text-sm">Organisation resolution: {payment.resolutionNote}</p> : null}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No payment records yet.</p>}</section> : null}</article>)}</div>{!assignedJobs.length ? <p className={panelClass}>No active assignments yet. Apply for work that matches your service and availability.</p> : null}</section>

          <section aria-labelledby="opportunities-title"><div className="mb-4"><p className="text-sm font-semibold uppercase tracking-wide text-primary">Marketplace</p><h2 id="opportunities-title" className="mt-1 text-2xl font-bold">Find available jobs</h2></div><form className={`${panelClass} mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]`}><CategoryField value={category} /><Field name="location" label="Location" value={location} required={false} /><button className="min-h-11 self-end rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground">Filter jobs</button></form><p className="mb-4 text-sm text-muted-foreground">Showing up to 50 open opportunities. Confirm the scope, timing and payment terms with the organisation before starting.</p><div className="grid gap-4 lg:grid-cols-2">{openJobs.map(job => { const application = applicationMap.get(job.id); return <article key={job.id} className={panelClass}><p className="text-sm text-primary">{job.org.name} · {job.category} · {job.location}</p><h3 className="mt-2 text-xl font-bold">{job.title}</h3><p className="my-3 whitespace-pre-line text-muted-foreground">{job.description}</p>{job.budget ? <p className="mb-3 font-medium">Indicative budget: KES {job.budget.toNumber().toLocaleString("en-KE")}</p> : <p className="mb-3 text-sm text-muted-foreground">Budget not specified</p>}{canApply ? <ActionForm action={applyToJob} label={application && ["PENDING", "REVIEWING"].includes(application.status) ? "Update application" : application?.status === "WITHDRAWN" || application?.status === "DECLINED" ? "Apply again" : "Apply for job"}><input type="hidden" name="jobId" value={job.id} /><TextField name="message" label="Proposal and availability" value={application?.message} maxLength={2000} /></ActionForm> : <p className="text-sm">{provider.status !== "ACTIVE" || !provider.available ? "Your profile must be approved and marked available before applying." : "Finish or hand over your current assignment before applying for another job."}</p>}</article>; })}</div>{!openJobs.length ? <p className={panelClass}>No open jobs match these filters yet. Try another service or location.</p> : null}</section>

          <section className="grid items-start gap-6 lg:grid-cols-2"><article className={panelClass}><p className="text-sm font-semibold uppercase tracking-wide text-primary">Public presence</p><h2 className="mb-4 mt-1 text-2xl font-bold">Edit my profile</h2><p className="mb-4 text-sm text-muted-foreground">Your business name, service area, experience statement, and portfolio appear in the public directory.</p><ActionForm action={saveProvider} label="Save profile"><ProfileFields profile={provider} /></ActionForm></article><article className={panelClass}><p className="text-sm font-semibold uppercase tracking-wide text-primary">Proof of experience</p><h2 className="mb-4 mt-1 text-2xl font-bold">Portfolio projects</h2><ActionForm action={addPortfolio} label="Add project"><Field name="title" label="Project title" maxLength={120} /><Field name="location" label="Project location" /><TextField name="description" label="What you delivered" maxLength={2000} /><Field name="imageUrl" label="Project photo URL (HTTPS, optional)" type="url" required={false} maxLength={1000} /></ActionForm><div className="mt-6 space-y-4">{projects.map(project => <article key={project.id} className="rounded-xl border border-border p-3"><h3 className="font-semibold">{project.title}</h3><p className="mt-1 text-sm text-muted-foreground">{project.location} · {project.description}</p><ActionForm action={deletePortfolio} label="Remove project" danger><input type="hidden" name="id" value={project.id} /></ActionForm></article>)}</div>{!projects.length ? <p className="mt-4 text-sm text-muted-foreground">Add completed work examples to help organisations compare your experience.</p> : null}</article></section>
        </main>
        <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground"><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · EstateDesk provider marketplace</footer>
      </div>
    </ProfilePictureProvider>
  );
}
