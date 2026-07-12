import type { OrgRole } from "@prisma/client";
import { QuotePriceCheckPanel } from "@/app/(app)/dashboard/caretaker/vendors/_components/quote-price-check";
import type { OrgExpendituresPageData } from "../_lib/types";
import { ExpendituresDirectorySection } from "./expenditures-directory-section";
import { ExpendituresForm } from "./expenditures-form";
import { ExpendituresGuidance } from "./expenditures-guidance";
import { ExpendituresHeader } from "./expenditures-header";
import { ExpendituresStats } from "./expenditures-stats";

export function ExpendituresWorkspace({
  data,
  orgRole,
  defaultDate,
}: {
  data: OrgExpendituresPageData;
  orgRole?: OrgRole | null;
  defaultDate: string;
}) {
  return (
    <div className="org-theme-content ed-mobile-first mx-auto w-full max-w-7xl space-y-4 px-3 pb-24 pt-3 sm:space-y-6 sm:px-6 sm:pt-4 lg:px-8">
      <ExpendituresHeader data={data} orgRole={orgRole} />
      <ExpendituresStats data={data} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <ExpendituresForm
          data={data}
          defaultDate={defaultDate}
          orgRole={orgRole}
        />
        <QuotePriceCheckPanel />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ExpendituresDirectorySection data={data} orgRole={orgRole} />
        <ExpendituresGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}