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
    <div className="org-theme-content mx-auto w-full min-w-0 max-w-7xl space-y-5 px-0 pb-24 pt-2 sm:px-2">
      <ImportsHeader
        history={history}
        historyUnavailable={historyUnavailable}
        orgRole={orgRole}
      />

      <CsvImportForm />
      <ImportsHistorySection history={history} historyUnavailable={historyUnavailable} />
      <ImportsGuidance orgRole={orgRole} />
    </div>
  );
}
