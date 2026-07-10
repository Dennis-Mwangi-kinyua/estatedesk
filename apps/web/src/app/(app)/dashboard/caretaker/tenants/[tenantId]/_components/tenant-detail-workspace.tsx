import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerTenantDetailPageData } from "../_lib/types";
import { TenantDetailHeader } from "./tenant-detail-header";
import { TenantDetailSections } from "./tenant-detail-sections";

export function TenantDetailWorkspace({
  data,
}: {
  data: CaretakerTenantDetailPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {!data.ok ? (
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not load tenant profile"
              message={data.errorMessage}
            />
          </div>
        </section>
      ) : (
        <>
          <TenantDetailHeader data={data} />
          <TenantDetailSections data={data} />
        </>
      )}

      <CaretakerWorkspaceFooter note="Tenant profile scoped to assigned units" />
    </div>
  );
}