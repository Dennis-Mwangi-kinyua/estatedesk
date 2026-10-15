import type { IntegrationReadinessReport } from "@/lib/integrations";

import type { JobsPageData } from "../_lib/queries";
import type { JobsPageInput } from "../_lib/types";

export type JobsWorkspaceProps = {
  data: JobsPageData;
  filters: JobsPageInput;
  queryParams: URLSearchParams;
  returnTo: string;
  integrationReadiness: IntegrationReadinessReport;
};

import { JobsOverviewSection } from "./jobs-overview-section";
import { JobsQueuesSection } from "./jobs-queues-section";

export function JobsWorkspace(props: JobsWorkspaceProps) {
  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
      <JobsOverviewSection {...props} />
      <JobsQueuesSection {...props} />
    </div>
  );
}
