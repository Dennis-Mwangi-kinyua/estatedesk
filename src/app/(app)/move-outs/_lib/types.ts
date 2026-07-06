import type { requireManagementAccess } from "@/lib/permissions/guards";
import type { getMoveOutsPageData } from "./queries";

export const PAGE_SIZE = 20;

export type SessionWithScope = Awaited<ReturnType<typeof requireManagementAccess>>;

export type MoveOutsSearchParams = {
  page?: string;
};

export type MoveOutsPageProps = {
  searchParams?: Promise<MoveOutsSearchParams>;
};

export type MoveOutsPageData = Awaited<ReturnType<typeof getMoveOutsPageData>>;