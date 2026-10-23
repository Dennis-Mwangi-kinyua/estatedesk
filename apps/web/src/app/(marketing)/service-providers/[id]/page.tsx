import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth/session";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { ProfileAvatar } from "@/components/uploads/profile-avatar";
import { ProfilePictureProvider } from "@/components/uploads/profile-picture-context";
import { visibleProviderWhere } from "@/features/providers/service";
import { ActionForm, panelClass, inputClass } from "@/features/providers/forms";
import { hireForJob } from "@/features/providers/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const provider = await prisma.serviceProvider.findFirst({ where: { id, ...visibleProviderWhere }, select: { businessName: true, category: true, location: true, bio: true } });
  if (!provider) return { title: "Provider unavailable", robots: { index: false, follow: false } };
  return publicPageMetadata({ title: `${provider.businessName} — ${provider.category} in ${provider.location}`, description: provider.bio.slice(0, 160), path: `/service-providers/${id}` });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = await prisma.serviceProvider.findFirst({
    where: { id, ...visibleProviderWhere },
    include: {
      user: { select: { profileImageUrl: true } },
      portfolio: { orderBy: { createdAt: "desc" } },
      reviews: { include: { job: { select: { title: true, org: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 50 },
      _count: { select: { jobs: { where: { status: "COMPLETED" } }, reviews: true, portfolio: true } },
    },
  });
  if (!provider) notFound();
  const session = await getUserSession();
  const canHire = Boolean(session?.activeOrgId && ["ADMIN", "MANAGER", "OFFICE"].includes(session.activeOrgRole ?? ""));
  const jobs = canHire ? await prisma.serviceJob.findMany({ where: { orgId: session!.activeOrgId!, status: "OPEN" }, select: { id: true, title: true }, take: 100, orderBy: { createdAt: "desc" } }) : [];
  const aggregate = await prisma.providerReview.aggregate({ where: { providerId: id }, _avg: { rating: true } });

  return (
    <ProfilePictureProvider url={provider.user.profileImageUrl}>
      <><PublicAccessHeader /><main className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/service-providers" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline">← Back to provider directory</Link>
        <section className={`${panelClass} overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-9`}>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xl font-bold text-primary"><ProfileAvatar name={provider.businessName} /></div>
              <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">{provider.category} · Serving {provider.location}</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">{provider.businessName}</h1><div className="mt-3 flex flex-wrap gap-2">{provider.reviewedAt ? <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Profile reviewed by EstateDesk</span> : null}<span className={`rounded-full px-3 py-1 text-xs font-semibold ${provider.available ? "bg-sky-500/10 text-sky-700 dark:text-sky-300" : "bg-muted text-muted-foreground"}`}>{provider.available ? "Available for work" : "Not taking new work"}</span></div></div>
            </div>
            <div className="grid min-w-[220px] grid-cols-3 gap-2 text-center"><div className="rounded-xl border border-border bg-background/70 p-3"><p className="text-lg font-bold">{aggregate._avg.rating ? `${aggregate._avg.rating.toFixed(1)}` : "—"}</p><p className="text-[11px] text-muted-foreground">Average rating</p></div><div className="rounded-xl border border-border bg-background/70 p-3"><p className="text-lg font-bold">{provider._count.jobs}</p><p className="text-[11px] text-muted-foreground">Completed</p></div><div className="rounded-xl border border-border bg-background/70 p-3"><p className="text-lg font-bold">{provider._count.portfolio}</p><p className="text-[11px] text-muted-foreground">Projects</p></div></div>
          </div>
          <div className="mt-7 max-w-4xl"><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">About this provider</h2><p className="mt-2 whitespace-pre-line text-base leading-7">{provider.bio}</p>{provider.portfolioUrl ? <a href={provider.portfolioUrl} rel="noopener noreferrer nofollow" target="_blank" className="mt-4 inline-flex min-h-10 items-center font-semibold text-primary underline underline-offset-4">Visit business portfolio ↗</a> : null}</div>
          <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">EstateDesk reviews provider profiles before approval. Profile review is not a guarantee of workmanship, licensing, insurance, or identity-document verification. Confirm scope and payment terms directly before work begins.</p>
        </section>

        <section className={panelClass} aria-labelledby="hire-title"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-primary">Work with this provider</p><h2 id="hire-title" className="mt-1 text-xl font-bold">Send a job offer</h2><p className="mt-1 text-sm text-muted-foreground">Choose one of your open jobs. The provider must accept the offer before starting.</p></div>{!canHire ? <Link href="/login?returnTo=%2Fservice-providers" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2 font-semibold">Sign in through your organisation</Link> : null}</div>
          {canHire && provider.available && jobs.length ? <div className="mt-4 max-w-2xl"><ActionForm action={hireForJob} label="Send offer"><input type="hidden" name="providerId" value={id} /><label className="block text-sm font-medium">Open organisation job<select name="jobId" className={inputClass}>{jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label><p className="text-sm text-muted-foreground">Agree timing and payment terms directly. EstateDesk does not process marketplace payments.</p></ActionForm></div> : canHire ? <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">{provider.available ? "Post an open job first, then send an offer from that job." : "This provider is not currently accepting new work."}</p> : null}
        </section>

        <section aria-labelledby="portfolio-title"><div className="mb-4"><p className="text-sm font-semibold uppercase tracking-wide text-primary">Experience</p><h2 id="portfolio-title" className="mt-1 text-2xl font-bold">Project portfolio</h2></div><div className="grid gap-4 md:grid-cols-2">{provider.portfolio.map(project => <article className={panelClass} key={project.id}>{project.imageUrl ? <Image src={project.imageUrl} alt={`${project.title} project`} width={900} height={600} unoptimized className="mb-4 aspect-[3/2] w-full rounded-xl object-cover" /> : <div className="mb-4 grid aspect-[3/2] place-items-center rounded-xl bg-muted text-sm text-muted-foreground">Project image not provided</div>}{project.imageUrl ? <a className="text-sm font-semibold text-primary underline" href={project.imageUrl} target="_blank" rel="noopener noreferrer nofollow">Open project image ↗</a> : null}<h3 className="mt-2 text-lg font-semibold">{project.title}</h3><p className="mt-1 text-sm font-medium text-primary">{project.location}</p><p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{project.description}</p></article>)}</div>{!provider.portfolio.length ? <p className={panelClass}>This provider has not added portfolio projects yet.</p> : null}</section>

        <section aria-labelledby="reviews-title"><div className="mb-4"><p className="text-sm font-semibold uppercase tracking-wide text-primary">Confirmed marketplace work</p><h2 id="reviews-title" className="mt-1 text-2xl font-bold">Organisation reviews</h2></div><div className="grid gap-3 md:grid-cols-2">{provider.reviews.map(review => <article key={review.id} className={panelClass}><div className="flex items-center justify-between gap-2"><p className="font-semibold">{review.rating} / 5</p><time className="text-xs text-muted-foreground" dateTime={review.createdAt.toISOString()}>{review.createdAt.toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })}</time></div><p className="mt-2 font-medium">{review.job.title}</p><p className="text-sm text-muted-foreground">{review.job.org.name}</p><p className="mt-3 whitespace-pre-line text-sm leading-6">{review.comment}</p></article>)}</div>{!provider.reviews.length ? <p className={panelClass}>Reviews are added only after an organisation confirms a completed job.</p> : null}</section>
      </main><PublicAccessFooter /></>
    </ProfilePictureProvider>
  );
}
