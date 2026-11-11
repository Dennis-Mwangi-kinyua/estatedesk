import Link from "next/link";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { careerMetadata, careerSearch, type CareerSearch } from "@/features/recruitment/seo";
import { publicJobs } from "@/features/recruitment/service";
import { CareerJobCard, HiringHero, hiringButton, hiringInput, hiringSecondary } from "@/features/recruitment/presentation";
export const dynamic = "force-dynamic";
export async function generateMetadata({ searchParams }: { searchParams: Promise<CareerSearch> }) {
  return careerMetadata(await searchParams);
}
export default async function Page({ searchParams }: { searchParams: Promise<CareerSearch> }) {
  const { q, location, employer, page } = careerSearch(await searchParams);
  const { jobs, total } = await publicJobs(q, location, employer, page);
  const href = (n: number) => `/careers?${new URLSearchParams({ q, location, employer, page: String(n) })}`;
  return <div className="flex min-h-screen flex-col bg-background text-foreground">
    <PublicAccessHeader active="careers" />
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-7 px-4 py-6 sm:px-6 sm:py-10">
      <HiringHero eyebrow="EstateDesk careers · jobs board" title="Find your next role in property." description="Explore career opportunities at EstateDesk and property organizations. Read the role, meet the employer and send your application directly to their hiring team.">
        <a href="#open-roles" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-950">Explore open roles</a><span className="inline-flex min-h-11 items-center text-sm text-indigo-200">Apply without creating an account</span>
      </HiringHero>
      <form role="search" aria-label="Search job advertisements" className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:p-6">
        <label className="grid min-w-0 gap-2 text-sm font-medium">Role, department or employer<input name="q" defaultValue={q} maxLength={100} placeholder="What would you like to do?" className={hiringInput} /></label>
        <label className="grid min-w-0 gap-2 text-sm font-medium">Location<input name="location" defaultValue={location} maxLength={100} placeholder="e.g. Nairobi" className={hiringInput} /></label>
        {employer && <input type="hidden" name="employer" value={employer} />}<button className={`${hiringButton} self-end`}>Find jobs</button>
      </form>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section id="open-roles" aria-labelledby="open-roles-title" className="min-w-0 scroll-mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">The opportunity board</p><h2 id="open-roles-title" className="mt-2 text-2xl font-semibold">{total} open {total === 1 ? "opportunity" : "opportunities"}</h2></div>{(q || location || employer) && <Link href="/careers" className={hiringSecondary}>Clear filters</Link>}</div>
          {!jobs.length && <div className="rounded-2xl border border-dashed border-indigo-300 bg-card px-6 py-12 dark:border-indigo-800"><h3 className="text-xl font-semibold">No open jobs match your search</h3><p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">Try another role or location, or check back for new advertisements. Only roles still accepting applications appear here.</p></div>}
          {jobs.map(job => <CareerJobCard key={job.id} job={job} />)}
          <nav aria-label="Job results pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">{page > 1 ? <Link href={href(page - 1)} className={hiringSecondary}>Previous</Link> : <span />}<span className="text-sm text-muted-foreground">Page {page} of {Math.max(1, Math.ceil(total / 20))}</span>{page * 20 < total ? <Link href={href(page + 1)} className={hiringSecondary}>Next</Link> : <span />}</nav>
        </section>
        <aside aria-label="Applying for a role" className="space-y-4 lg:sticky lg:top-6">
          <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">Your application, step by step</h2><ol className="mt-4 space-y-4 text-sm">{[["1", "Find the right role", "Check the responsibilities, location and closing date."], ["2", "Tell your story", "Share your experience and an optional PDF CV."], ["3", "Hear from the employer", "Their hiring team reviews your application and arranges any next steps."]].map(([n, title, text]) => <li key={n} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">{n}</span><div><h3 className="font-medium">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div></li>)}</ol></section>
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-950/40"><h2 className="font-semibold">Work at EstateDesk</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">See opportunities with the team building EstateDesk.</p><Link href="/careers?employer=platform" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-indigo-800 underline dark:text-indigo-200">EstateDesk jobs</Link></section>
        </aside>
      </div>
    </main><PublicAccessFooter />
  </div>;
}
