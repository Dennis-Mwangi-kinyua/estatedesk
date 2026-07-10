export const DEFAULT_PAGE_SIZE = 20;

export type JobsSearchParams = Promise<{
  q?: string;
  jobStatus?: string;
  pageSize?: string;
  queuedPage?: string;
  failedPage?: string;
  kraPage?: string;
  runsPage?: string;
}>;

export type JobsPageInput = {
  q: string;
  jobStatus: string;
  pageSize: number;
  queuedPage: number;
  failedPage: number;
  kraPage: number;
  runsPage: number;
};