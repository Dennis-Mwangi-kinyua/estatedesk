import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { getCaretakerUnitHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import type { CaretakerUnitDetailPageData } from "../_lib/types";
import { BillingDeadlinesCard } from "./billing-deadlines-card";
import { UnitActivityTimeline } from "./unit-activity-timeline";
import { UnitDetailHeader } from "./unit-detail-header";
import { UnitDetailSections } from "./unit-detail-sections";
import { UnitQrPanel } from "./unit-qr-panel";

export function UnitDetailWorkspace({
  data,
}: {
  data: CaretakerUnitDetailPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {!data.ok ? (
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not load unit profile"
              message={data.errorMessage}
            />
          </div>
        </section>
      ) : (
        <>
          <UnitDetailHeader data={data} />
          <UnitDetailSections data={data} />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <UnitActivityTimeline data={data} />
            <div className="space-y-5">
              <BillingDeadlinesCard data={data} />
              <UnitQrPanel profilePath={getCaretakerUnitHref(data.unit.id)} />
            </div>
          </div>
        </>
      )}

      <CaretakerWorkspaceFooter note="Apartment operations profile" />
    </div>
  );
}