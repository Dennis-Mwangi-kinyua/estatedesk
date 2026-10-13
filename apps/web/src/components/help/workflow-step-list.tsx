export type WorkflowStepItem = {
  step: string | number;
  title: string;
  description: string;
};

export function WorkflowStepCards({
  steps,
}: {
  steps: readonly WorkflowStepItem[];
}) {
  return steps.map((item) => (
    <article
      key={item.step}
      className="rounded-2xl border border-border bg-muted/15 p-4"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {item.step}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {item.description}
      </p>
    </article>
  ));
}
