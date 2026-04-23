"use server";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import {
  getOrgDashboardSummary,
  type OrgDashboardSummary,
} from "@/features/dashboard/server/get-org-dashboard-summary";

export async function getLiveOrgDashboardSummaryAction(): Promise<OrgDashboardSummary> {
  const session = await requireUserSession();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId ?? undefined,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
    },
  });

  const fallbackMembership =
    membership ??
    (await prisma.membership.findFirst({
      where: {
        userId: session.userId,
        role: {
          in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
        },
        org: {
          deletedAt: null,
          status: "ACTIVE",
        },
        user: {
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        orgId: true,
      },
    }));

  if (!fallbackMembership) {
    throw new Error("No active organization found");
  }

  return getOrgDashboardSummary(fallbackMembership.orgId);
}