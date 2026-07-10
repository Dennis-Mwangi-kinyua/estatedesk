import type { getAccountingRequestsQueue } from "./queries";

export type AccountingRequestsQueueData = Awaited<
  ReturnType<typeof getAccountingRequestsQueue>
>;

export type FinanceRequestsPageData = Awaited<
  ReturnType<typeof import("./queries").getFinanceRequestsPageData>
>;