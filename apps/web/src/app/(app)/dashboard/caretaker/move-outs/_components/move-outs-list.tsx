import Link from "next/link";
import { ErrorStateCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { formatDate } from "../_lib/helpers";
import type { CaretakerMoveOutsPageData } from "../_lib/types";

export function MoveOutsList({
  data,
}: {
  data: CaretakerMoveOutsPageData;
}) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro eyebrow="Queue" title="Move-out notices" />
      <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
        {!data.ok ? (
          <ErrorStateCard message={data.errorMessage} />
        ) : data.notices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
            No move-out notices in your current assignment scope.
          </div>
        ) : (
          data.notices.map((notice) => (
            <article
              key={notice.id}
              className="rounded-2xl border border-border bg-muted/10 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold capitalize text-muted-foreground">
                  {notice.status.replaceAll("_", " ").toLowerCase()}
                </span>
                {notice.inspection ? (
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                    Inspection {notice.inspection.status.toLowerCase()}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {notice.tenant.fullName}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {[
                  notice.lease.unit.property.name,
                  notice.lease.unit.building?.name,
                  `Unit ${notice.lease.unit.houseNo}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Move-out {formatDate(notice.moveOutDate)}
                {notice.tenant.phone ? ` · ${notice.tenant.phone}` : ""}
              </p>
              {notice.inspectionHref ? (
                <Link
                  href={notice.inspectionHref}
                  className="mt-3 inline-flex text-sm font-semibold text-primary"
                >
                  Open inspection
                </Link>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}