import { prisma } from "@/lib/prisma";
import { APP_PLANS, type AppPlan } from "@/lib/billing/plans";

export async function getOrgPlan(orgId: string): Promise<AppPlan> {
  const subscription = await prisma.subscription.findUnique({
    where: { orgId },
    select: {
      plan: true,
      status: true,
    },
  });

  if (!subscription) return "FREE";

  if (subscription.status !== "ACTIVE") {
    return "FREE";
  }

  if (!subscription.plan || !(subscription.plan in APP_PLANS)) {
    return "FREE";
  }

  return subscription.plan as AppPlan;
}

export async function canCreateProperty(orgId: string) {
  const [plan, count] = await Promise.all([
    getOrgPlan(orgId),
    prisma.property.count({
      where: {
        orgId,
        deletedAt: null,
      },
    }),
  ]);

  return count < APP_PLANS[plan].propertiesLimit;
}

export async function canCreateUnit(orgId: string) {
  const [plan, count] = await Promise.all([
    getOrgPlan(orgId),
    prisma.unit.count({
      where: {
        deletedAt: null,
        property: {
          orgId,
          deletedAt: null,
        },
      },
    }),
  ]);

  return count < APP_PLANS[plan].unitsLimit;
}