import type { getSmartOrgInsights } from "@/features/insights/server/get-smart-org-insights";

export type InsightsPageData = Awaited<ReturnType<typeof getSmartOrgInsights>> & {
  organizationName: string;
};