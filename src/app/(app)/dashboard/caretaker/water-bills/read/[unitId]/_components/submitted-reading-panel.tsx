import {
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";

type SubmittedReadingPanelProps = {
  prevReading: number;
  currentReading: number;
  unitsUsed: number;
  status: string;
};

export function SubmittedReadingPanel({
  prevReading,
  currentReading,
  unitsUsed,
  status,
}: SubmittedReadingPanelProps) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Submitted"
        title="Reading already submitted"
      />

      <div className="space-y-4 p-5 sm:p-6">
        <p className="text-sm leading-6 text-muted-foreground">
          A reading for this unit and period already exists and is awaiting or
          has completed office review.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: "Previous", value: prevReading },
            { label: "Current", value: currentReading },
            { label: "Units used", value: unitsUsed },
            { label: "Status", value: status },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-muted/10 p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}