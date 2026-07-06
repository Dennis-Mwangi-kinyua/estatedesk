import type { OrgRole } from "@prisma/client";
import { CsvImportForm } from "../import-form";
import type { ImportHistoryItem } from "../_lib/types";
import { ImportsGuidance } from "./imports-guidance";
import { ImportsHeader } from "./imports-header";
import { ImportsHistorySection } from "./imports-history-section";

export function ImportsWorkspace({
  history,
  historyUnavailable,
  orgRole,
}: {
  history: ImportHistoryItem[];
  historyUnavailable: boolean;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <ImportsHeader
        history={history}
        historyUnavailable={historyUnavailable}
        orgRole={orgRole}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <CsvImportForm />
          <ImportsHistorySection
            history={history}
            historyUnavailable={historyUnavailable}
          />
        </div>
        <ImportsGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}