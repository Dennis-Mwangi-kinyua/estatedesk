import { Fragment } from "react";
import type { IntegrationReadinessReport } from "@/lib/integrations";
import {
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
  labelize,
  toneForStatus,
} from "../../_components/control-plane";
import {
  queueKraRetryAction,
  retryAllFailedNotificationsAction,
  retryFailedNotificationAction,
  runNotificationsJobAction,
  runRetentionJobAction,
} from "../actions";
import { JobActionButton } from "../job-action-controls";
import type { JobsPageData } from "../_lib/queries";
import type { JobsPageInput } from "../_lib/types";
import { DEFAULT_PAGE_SIZE } from "../_lib/types";
import { formatAge, formatJson, readProviderError } from "../_lib/helpers";
import { HiddenReturnTo, MobileEmpty, MobileField, SectionPager } from "./jobs-ui";

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
