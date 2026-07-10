import type { requireManagementAccess } from "@/lib/permissions/guards";

export type SessionWithScope = Awaited<ReturnType<typeof requireManagementAccess>>;

export const PAGE_SIZE = 12;

export type BuildingsPageProps = {
  searchParams?: Promise<{ q?: string; page?: string }>;
};


