import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerUnitsPageData } from "../_lib/types";
import { UnitsHeader } from "./units-header";
import { UnitsList } from "./units-list";
import { UnitsStats } from "./units-stats";

export function UnitsWorkspace({ data }: { data: CaretakerUnitsPageData }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {!data.ok ? (
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not load units"
              message={data.errorMessage}
            />
          </div>
        </section>
      ) : (
        <>
          <UnitsHeader data={data} />
          <UnitsStats data={data} />
          <UnitsList data={data} />
        </>
      )}

      <CaretakerWorkspaceFooter note="Assigned apartment directory" />
    </div>
  );
}