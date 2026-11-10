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
  return <div className="flex min-h-screen flex-col bg-background text-foreground"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(jobStructuredData(job)) }} /><PublicAccessHeader /><main className="mx-auto w-full max-w-5xl flex-1 space-y-7 px-4 py-8 sm:px-6"><Link href="/careers" className="inline-flex min-h-11 items-center text-sm underline">All job opportunities</Link><header><Link className="inline-flex min-h-11 items-center font-semibold text-primary underline" href={`/careers?employer=${job.org?.slug ?? "platform"}`}>{employer}</Link><h1 className="mt-2 text-3xl font-bold">{job.title}</h1><p className="mt-3 text-muted-foreground">{job.location} · {label(job.employmentType)} · {label(job.workplace)}{job.department ? ` · ${job.department}` : ""}</p><p className="mt-3 text-sm">Posted by {job.postedByName} for {employer} · apply by {new Intl.DateTimeFormat("en-KE", { dateStyle: "long", timeZone: "Africa/Nairobi" }).format(job.closesAt)}</p>{job.salaryMin && job.salaryMax && <p className="mt-3 font-medium">{money(job.salaryMin)} – {money(job.salaryMax)} per {label(job.salaryPeriod).toLowerCase()}</p>}</header><section className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="text-xl font-semibold">About the role</h2><p className="whitespace-pre-wrap leading-7">{job.description}</p></section><section className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="text-xl font-semibold">Requirements</h2><p className="whitespace-pre-wrap leading-7">{job.requirements}</p></section><PublicApplicationForm slug={job.slug} employer={employer} /></main><PublicAccessFooter /></div>;
}
