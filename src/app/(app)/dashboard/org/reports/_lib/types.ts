import type { OrgRole } from "@prisma/client";
import type { loadReportsPageData } from "./queries";

export type ReportsSearchParams = {
  apartment?: string;
  payment?: string;
  period?: string;
};

export type OrgReportsPageProps = {
  searchParams?: Promise<ReportsSearchParams>;
};

export type ReportsPageData = Awaited<ReturnType<typeof loadReportsPageData>>;

export type TenantReportRow = ReportsPageData["filteredRows"][number];

export type TenantReportCardProps = {
  title: string;
  description: string;
  emptyText: string;
  rows: TenantReportRow[];
  showRentGuideWhenEmpty?: boolean;
  orgRole?: OrgRole | null;
};