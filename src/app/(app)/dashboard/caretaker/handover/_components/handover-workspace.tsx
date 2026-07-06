import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerHandoverPageData } from "../_lib/types";
import { HandoverForm } from "./handover-form";
import { HandoverLog } from "./handover-log";

export function HandoverWorkspace({
  data,
}: {
  data: CaretakerHandoverPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="p-5 sm:p-6">
          <p className="text-sm text-muted-foreground">
            <CaretakerI18nLabel labelKey="shiftContinuity" />
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            <CaretakerI18nLabel labelKey="handoverTitle" />
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            <CaretakerI18nLabel labelKey="handoverSubtitle" />
          </p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <HandoverForm
          prefillNotesByLocale={
            data.ok
              ? data.prefillNotesByLocale
              : { en: "", sw: "" }
          }
          openIssueCount={data.ok ? data.openIssues.length : 0}
          urgentCount={data.ok ? data.urgentCount : 0}
        />
        <HandoverLog data={data} />
      </div>

      <CaretakerWorkspaceFooter note="Caretaker shift handover records" />
    </div>
  );
}