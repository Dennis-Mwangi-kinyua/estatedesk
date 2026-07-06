import { ErrorStateCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { formatDateTime } from "../_lib/helpers";
import type { CaretakerHandoverPageData } from "../_lib/types";

export function HandoverLog({
  data,
}: {
  data: CaretakerHandoverPageData;
}) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro eyebrow="History" title="Recent handovers" />
      <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
        {!data.ok ? (
          <ErrorStateCard message={data.errorMessage} />
        ) : data.handovers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
            No shift handovers recorded for this organization yet.
          </div>
        ) : (
          data.handovers.map((entry) => {
            const metadata =
              entry.metadata &&
              typeof entry.metadata === "object" &&
              !Array.isArray(entry.metadata)
                ? (entry.metadata as { notes?: string })
                : null;

            return (
              <article
                key={entry.id}
                className="rounded-2xl border border-border bg-muted/10 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {entry.actor.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {metadata?.notes ?? "No notes recorded."}
                </p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}