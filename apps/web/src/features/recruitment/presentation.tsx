import type { ReactNode } from "react";
import Link from "@/components/navigation/workspace-link";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, MapPin } from "lucide-react";
import { label } from "./policy";

export const hiringInput = "min-h-11 min-w-0 w-full rounded-xl border border-border bg-background px-3 py-2 text-base";
export const hiringButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600";
export const hiringSecondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-indigo-500";
export const hiringDate = (value: Date) => new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "Africa/Nairobi" }).format(value);

export function HiringHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <header className="relative isolate overflow-hidden rounded-3xl border border-indigo-200 bg-indigo-950 p-5 text-white dark:border-indigo-800 sm:p-8">
    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full border-[40px] border-indigo-400/10" />
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-200"><BriefcaseBusiness aria-hidden="true" className="size-4" />{eyebrow}</p>
    <h1 data-heading-icon="custom" className="mt-4 max-w-3xl break-words text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
    <p className="mt-3 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">{description}</p>
    {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
  </header>;
}

export function HiringPanel({ title, description, children, id }: { title: string; description?: string; children: ReactNode; id?: string }) {
  return <section id={id} className="min-w-0 scroll-mt-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
    <div className="mb-5 border-b border-border pb-4"><h2 className="text-lg font-semibold">{title}</h2>{description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}</div>{children}
  </section>;
}

export function HiringStatus({ status }: { status: string }) {
  const tone = status === "OPEN" || status === "HIRED" ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" : status === "DRAFT" ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" : "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200";
  return <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{status === "OPEN" ? "Accepting applications" : label(status)}</span>;
}

export function HiringSteps() {
  return <ol aria-label="Hiring process" className="grid gap-3 sm:grid-cols-3">{[
    ["01", "Advertise a role", "Prepare the responsibilities, requirements and deadline."],
    ["02", "Review candidates", "Read applications and CVs in a private applicant workspace."],
    ["03", "Make your next hire", "Track shortlisting, interviews and offer decisions."],
  ].map(([number, title, body]) => <li key={number} className="flex gap-3 rounded-2xl border border-border bg-card p-4"><span className="text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-300">{number}</span><div className="min-w-0"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p></div></li>)}</ol>;
}

type PublicJobCardData = { slug: string; title: string; location: string; employmentType: string; workplace: string; description: string; closesAt: Date; postedByName: string; org: { name: string } | null };
export function CareerJobCard({ job }: { job: PublicJobCardData }) {
  const employer = job.org?.name ?? "EstateDesk";
  return <article className="group grid min-w-0 gap-5 rounded-2xl border border-border bg-card p-5 transition hover:border-indigo-300 dark:hover:border-indigo-700 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
    <div aria-hidden="true" className="grid size-12 place-items-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">{employer.slice(0, 1).toUpperCase()}</div>
    <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">{employer}</p><h3 className="mt-2 break-words text-xl font-semibold"><Link href={`/careers/${job.slug}`} className="hover:underline">{job.title}</Link></h3><div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin aria-hidden="true" className="size-3.5" />{job.location}</span><span>· {label(job.employmentType)}</span><span>· {label(job.workplace)}</span></div><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{job.description.slice(0, 220)}{job.description.length > 220 ? "…" : ""}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">Posted by {job.postedByName}</p></div>
    <div className="flex flex-wrap items-center justify-between gap-3 sm:col-start-2 lg:col-start-auto lg:flex-col lg:items-end"><p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays aria-hidden="true" className="size-4" />Closes {hiringDate(job.closesAt)}</p><Link href={`/careers/${job.slug}`} className={hiringSecondary}>View role & apply<ArrowUpRight aria-hidden="true" className="size-4" /></Link></div>
  </article>;
}
