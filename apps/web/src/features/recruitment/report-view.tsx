import type { recruitmentReport } from "./reports";
import { label } from "./policy";
import { HiringPanel } from "./presentation";
export function RecruitmentReport({ report }: { report: Awaited<ReturnType<typeof recruitmentReport>> }) {
  return <HiringPanel id="recruitment-reports" title="Recruitment reports" description="Applications received in the last 90 days. Sources are self-reported by candidates; historic records stay unspecified.">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Applications in period</p><p className="mt-1 text-2xl font-semibold">{report.total}</p></div><div><p className="text-xs text-muted-foreground">Candidates with a hire event</p><p className="mt-1 text-2xl font-semibold">{report.hires}</p></div><div><p className="text-xs text-muted-foreground">Average application-to-hire</p><p className="mt-1 text-2xl font-semibold">{report.averageHireDays === null ? "No hires yet" : `${report.averageHireDays.toFixed(1)} days`}</p></div></div>
    {report.capped && <p role="status" className="mt-4 text-sm text-amber-800 dark:text-amber-200">Stage, source and hire metrics use the most recent {report.sampled} of {report.total} applications.</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-3">{[
      { title: "Application sources", counts: report.sources }, { title: "Candidates reaching each stage", counts: report.reached }, { title: "Exit events by previous stage", counts: report.exits },
    ].map(({title, counts}) => <section key={String(title)} className="min-w-0"><h3 className="text-sm font-semibold">{String(title)}</h3><dl className="mt-3 space-y-2">{Object.entries(counts).map(([key, count]) => <div key={key} className="flex justify-between gap-3 border-b border-border py-2 text-sm"><dt className="text-muted-foreground">{label(key)}</dt><dd className="font-semibold tabular-nums">{count}</dd></div>)}</dl></section>)}</div>
    <p className="mt-4 text-xs leading-6 text-muted-foreground">Stage counts use actual recorded stages and can overlap. Exits count recorded rejection or withdrawal transitions, including later reopened reviews; they do not infer silent drop-offs. Time to hire runs from application receipt to the first recorded hire.</p>
  </HiringPanel>;
}
