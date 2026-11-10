import Link from "@/components/navigation/workspace-link";
import type { SetupStep } from "@/lib/workflow/setup-progress";

export function SetupTeamNudge({ step }: { step: SetupStep }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="setup-team-title">
      <h2 id="setup-team-title" className="text-lg font-semibold">Invite the people who run the queue</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.detail}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link href={step.href} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground">{step.action}</Link>
        {step.secondaryHref && step.secondaryLabel ? <Link href={step.secondaryHref} className="inline-flex min-h-11 items-center text-sm font-semibold underline">{step.secondaryLabel}</Link> : null}
      </div>
    </section>
  );
}

export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const next = steps.find((step) => !step.done);
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="setup-progress-title">
      <h2 id="setup-progress-title" className="text-lg font-semibold">Finish the first bill</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">Use these steps to issue the first bill and prepare your team. {next ? `Next: ${next.title}.` : "Every step is done."}</p>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={step.id} className="rounded-xl border border-border p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{index + 1}. {step.title} <span className="sr-only">{step.done ? "Completed" : "Needs setup"}</span></p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.detail}</p>
              </div>
              <span aria-hidden="true" className="text-sm font-semibold text-primary">{step.done ? "Done" : "Open"}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href={step.href} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground">{step.action}</Link>
              {step.secondaryHref && step.secondaryLabel ? <Link href={step.secondaryHref} className="inline-flex min-h-11 items-center text-sm font-semibold underline">{step.secondaryLabel}</Link> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
