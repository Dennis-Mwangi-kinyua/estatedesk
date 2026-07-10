import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerDocumentsPageData } from "../_lib/types";

export function DocumentsHeader({
  data,
}: {
  data: CaretakerDocumentsPageData;
}) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <p className="text-sm text-muted-foreground">Records locker</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Documents
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Official records and uploaded files for units and tenants in your
          assignment scope.
        </p>
        {data.ok ? (
          <p className="mt-4 text-sm font-medium text-foreground">
            {data.totalCount} file{data.totalCount === 1 ? "" : "s"} available
          </p>
        ) : null}
      </div>
    </section>
  );
}