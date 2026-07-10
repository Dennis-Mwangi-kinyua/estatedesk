import type { loadTenantsPageData } from "./queries";

export const STATUS_OPTIONS = ["ALL", "ACTIVE", "INACTIVE", "BLACKLISTED"] as const;
export type TenantFilterStatus = (typeof STATUS_OPTIONS)[number];

export type TenantsPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    created?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export type TenantsPageData = Awaited<ReturnType<typeof loadTenantsPageData>>;

export type TenantRow = TenantsPageData["tenants"][number];