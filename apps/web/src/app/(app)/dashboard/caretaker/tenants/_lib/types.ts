import type { getCaretakerTenantsData } from "./queries";

export const PAGE_SIZE = 20;

export type TenantsSearchParams = {
  page?: string;
  q?: string;
};

export type TenantsPageProps = {
  searchParams?: Promise<TenantsSearchParams>;
};

export type CaretakerTenantsPageData = Awaited<
  ReturnType<typeof getCaretakerTenantsData>
>;
