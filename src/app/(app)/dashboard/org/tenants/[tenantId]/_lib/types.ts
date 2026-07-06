import type { loadTenantDetailsData } from "./queries";

export type ManagedRole = "ADMIN" | "MANAGER" | "OFFICE";

export type TenantDetailsPageProps = {
  params: Promise<{
    tenantId: string;
  }>;
};

export type TenantDetailsData = Awaited<ReturnType<typeof loadTenantDetailsData>>;