import "server-only";

import { prisma } from "@/lib/prisma";
import { getSmartOrgInsights } from "@/features/insights/server/get-smart-org-insights";
import type { InsightsPageData } from "./types";

export async function getInsightsPageData(orgId: string): Promise<InsightsPageData> {
  const [insights, organization] = await Promise.all([
    getSmartOrgInsights(orgId),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    }),
  ]);

  return {
    ...insights,
    organizationName: organization?.name ?? "Organisation",
  };
}