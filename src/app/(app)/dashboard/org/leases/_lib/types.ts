import type { getOrgLeasesPageData } from "./queries";

export const PAGE_SIZE = 20;

export type LeasesSearchParams = {
  page?: string;
};

export type LeasesPageProps = {
  searchParams?: Promise<LeasesSearchParams>;
};

export type OrgLeasesPageData = Awaited<ReturnType<typeof getOrgLeasesPageData>>;