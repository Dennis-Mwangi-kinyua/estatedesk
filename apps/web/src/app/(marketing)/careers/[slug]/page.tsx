import { HiringHero, HiringPanel, hiringSecondary, hiringButton, hiringDate } from "@/features/recruitment/presentation";
import type { Metadata } from "next";
import { cache } from "react";
import { jobStructuredData } from "@/features/recruitment/seo";
import { serializeJsonForHtml } from "@/lib/security/safe-json";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { publicJob } from "@/features/recruitment/service";
import { label } from "@/features/recruitment/policy";
import { PublicApplicationForm } from "@/features/recruitment/forms";
import { publicPageMetadata } from "@/lib/seo";
export const dynamic = "force-dynamic";
const getJob = cache(publicJob);
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params, job = await getJob(slug);
  if (!job) return { title: "Job unavailable", robots: { index: false, follow: false } };
  return publicPageMetadata({ title: `${job.title} at ${job.org?.name ?? "EstateDesk"}`, description: job.description.slice(0, 160), path: `/careers/${job.slug}` });
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const job = await getJob((await params).slug); if (!job) notFound();
  const employer = job.org?.name ?? "EstateDesk";
  const money = (v: { toString(): string }) => new Intl.NumberFormat("en-KE", { style: "currency", currency: job.currencyCode }).format(Number(v));
  return <div className="flex min-h-screen flex-col bg-background text-foreground">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(jobStructuredData(job)) }} />
    <PublicAccessHeader active="careers" />
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/careers" className={hiringSecondary}>← All job opportunities</Link>
      <HiringHero eyebrow={`${employer} · career opportunity`} title={job.title} description={`${job.location} · ${label(job.employmentType)} · ${label(job.workplace)}${job.department ? ` · ${job.department}` : ""}`}>
        <a href="#apply" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-950">Apply for this role</a><span className="inline-flex min-h-11 items-center text-sm text-indigo-200">Applications close {hiringDate(job.closesAt)}</span>
      </HiringHero>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <HiringPanel title="About the role"><p className="whitespace-pre-wrap break-words text-sm leading-7">{job.description}</p></HiringPanel>
          <HiringPanel title="What you’ll bring"><p className="whitespace-pre-wrap break-words text-sm leading-7">{job.requirements}</p></HiringPanel>
        </div>
        <aside aria-label="Job details" className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:row-span-2">
          <HiringPanel title="At a glance"><dl className="space-y-4 text-sm">{[["Employer", employer], ["Location", job.location], ["Employment", label(job.employmentType)], ["Workplace", label(job.workplace)], ["Apply by", hiringDate(job.closesAt)], ["Salary", job.salaryMin && job.salaryMax ? `${money(job.salaryMin)} – ${money(job.salaryMax)} per ${label(job.salaryPeriod).toLowerCase()}` : "Not advertised"]].map(([title, value]) => <div key={title}><dt className="text-xs text-muted-foreground">{title}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl><a href="#apply" className={`${hiringButton} mt-5 w-full`}>Start application</a></HiringPanel>
          <div className="rounded-2xl border border-border p-5"><p className="text-sm leading-6 text-muted-foreground">Posted by {job.postedByName} for {employer}</p><Link className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline" href={`/careers?employer=${job.org?.slug ?? "platform"}`}>More roles from this employer</Link><p className="mt-3 text-xs leading-6 text-muted-foreground">Your application is shared with this employer for recruitment. Internal review notes are private to the hiring team.</p></div>
        </aside>
        <section id="apply" aria-label="Submit your application" className="min-w-0 scroll-mt-6 lg:col-start-1"><PublicApplicationForm slug={job.slug} employer={employer} /></section>
      </div>
    </main><PublicAccessFooter />
  </div>;
}
