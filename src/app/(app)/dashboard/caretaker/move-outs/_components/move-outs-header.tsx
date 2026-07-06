import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerMoveOutsPageData } from "../_lib/types";

export function MoveOutsHeader({
  data,
}: {
  data: CaretakerMoveOutsPageData;
}) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <p className="text-sm text-muted-foreground">Vacancy workflow</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Move-outs
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Track tenant move-out notices and inspection follow-up for units in
          your assignment scope.
        </p>
        {data.ok ? (
          <p className="mt-4 text-sm font-medium text-foreground">
            {data.notices.length} notice{data.notices.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
    </section>
  );
}