import type { loadTenantExpendituresPageData } from "./queries";

export const PAGE_SIZE = 20;

export type ExpendituresSearchParams = {
  page?: string;
};

export type ExpendituresPageProps = {
  searchParams?: Promise<ExpendituresSearchParams>;
};

export type TenantExpendituresPageData = NonNullable<
  Awaited<ReturnType<typeof loadTenantExpendituresPageData>>
>;