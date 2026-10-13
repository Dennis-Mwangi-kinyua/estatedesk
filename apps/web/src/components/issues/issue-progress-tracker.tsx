import { Check, CircleDashed } from "lucide-react";
const formatDate = (value: Date) => new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Nairobi" }).format(value);
import { getIssueProgress } from "@/lib/issues/progress";

export function IssueProgressTracker({ issue }: { issue: Parameters<typeof getIssueProgress>[0] }) {
  const { steps, currentIndex, cancelled } = getIssueProgress(issue);
  return (
    <section aria-labelledby="issue-progress-heading" className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 id="issue-progress-heading" className="text-lg font-semibold text-foreground">Issue progress</h2><p className="mt-1 text-sm text-muted-foreground">Track responsibility, completed work, and confirmation.</p></div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{cancelled ? "Cancelled" : currentIndex >= 0 ? `Current step: ${steps[currentIndex].label}` : "Completed"}</span>
      </div>
      {cancelled ? <p className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">This issue is cancelled. Reopen it to resume work.</p> : null}
      <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => {
          const current = currentIndex === index;
          return <li key={step.label} aria-current={current ? "step" : undefined} className={`flex min-w-0 items-start gap-3 rounded-2xl border p-4 ${current ? "border-primary/40 bg-primary/5" : "border-border bg-background/50"}`}>
            <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${step.complete ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200" : current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step.complete ? <Check aria-hidden="true" className="size-4" /> : current ? index + 1 : <CircleDashed aria-hidden="true" className="size-4" />}</span>
            <div className="min-w-0"><p className="text-sm font-semibold text-foreground">{step.label}</p><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{step.caption}</p>{step.at ? <p className="mt-1 text-xs text-muted-foreground">{formatDate(step.at)}</p> : null}<p className="mt-1 text-[11px] font-medium text-muted-foreground">{step.complete ? "Complete" : current ? "Current step" : "Pending"}</p></div>
          </li>;
        })}
      </ol>
    </section>
  );
}
