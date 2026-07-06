import { isTransientDatabaseError } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";

export async function loadPlatformMarketingData() {
  try {
    const [marketers, leads, organizations, unassignedLeads, unassignedOrgs] =
      await Promise.all([
        prisma.platformMarketer.findMany({
          orderBy: [{ status: "asc" }, { fullName: "asc" }],
          include: {
            _count: {
              select: {
                onboardingRequests: true,
                organizations: true,
              },
            },
          },
        }),
        prisma.onboardingRequest.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            marketer: {
              select: {
                id: true,
                fullName: true,
                referralCode: true,
              },
            },
          },
        }),
        prisma.organization.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            marketer: {
              select: {
                id: true,
                fullName: true,
                referralCode: true,
              },
            },
            subscription: {
              select: {
                plan: true,
                status: true,
              },
            },
          },
        }),
        prisma.onboardingRequest.count({ where: { marketerId: null } }),
        prisma.organization.count({ where: { marketerId: null, deletedAt: null } }),
      ]);

    return {
      degraded: false,
      marketers,
      leads,
      organizations,
      unassignedLeads,
      unassignedOrgs,
    };
  } catch (error) {
    if (!isTransientDatabaseError(error)) {
      throw error;
    }

    console.warn("Platform marketing data temporarily unavailable:", error);

    return {
      degraded: true,
      marketers: [],
      leads: [],
      organizations: [],
      unassignedLeads: 0,
      unassignedOrgs: 0,
    };
  }
}

