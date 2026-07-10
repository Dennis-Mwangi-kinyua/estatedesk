"use server";

import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getVacancyInquiryAlerts } from "@/features/dashboard/server/get-vacancy-inquiry-alerts";

export async function getLiveVacancyInquiryAlertsAction() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    throw new Error("No active organization found");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      role: { in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"] },
    },
    select: { orgId: true },
  });

  if (!membership) {
    throw new Error("No active organization found");
  }

  return getVacancyInquiryAlerts(membership.orgId);
}