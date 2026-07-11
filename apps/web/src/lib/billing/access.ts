import "server-only";

import { prisma } from "@/lib/prisma";
import { APP_PLANS, type AppPlan } from "@/lib/billing/plans";

const PLAN_ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING"]);

export type PlanUsage = {
  plan: AppPlan;
  properties: number;
  units: number;
  staffUsers: number;
  propertiesLimit: number;
  unitsLimit: number;
  usersLimit: number;
};

export async function getOrgPlan(orgId: string): Promise<AppPlan> {
  const subscription = await prisma.subscription.findUnique({
    where: { orgId },
    select: {
      plan: true,
      status: true,
    },
  });

  if (!subscription) return "FREE";

  if (!PLAN_ACTIVE_STATUSES.has(subscription.status)) {
    return "FREE";
  }

  if (!subscription.plan || !(subscription.plan in APP_PLANS)) {
    return "FREE";
  }

  return subscription.plan as AppPlan;
}

export async function getOrgPlanUsage(orgId: string): Promise<PlanUsage> {
  const [plan, properties, units, staffUsers] = await Promise.all([
    getOrgPlan(orgId),
    prisma.property.count({
      where: { orgId, deletedAt: null },
    }),
    prisma.unit.count({
      where: {
        deletedAt: null,
        property: { orgId, deletedAt: null },
      },
    }),
    prisma.membership.count({
      where: {
        orgId,
        role: {
          in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"],
        },
        user: { deletedAt: null },
      },
    }),
  ]);

  const limits = APP_PLANS[plan];

  return {
    plan,
    properties,
    units,
    staffUsers,
    propertiesLimit: limits.propertiesLimit,
    unitsLimit: limits.unitsLimit,
    usersLimit: limits.usersLimit,
  };
}

export async function canCreateProperty(orgId: string, additional = 1) {
  const usage = await getOrgPlanUsage(orgId);
  return usage.properties + additional <= usage.propertiesLimit;
}

export async function canCreateUnit(orgId: string, additional = 1) {
  const usage = await getOrgPlanUsage(orgId);
  return usage.units + additional <= usage.unitsLimit;
}

export async function canCreateStaffUser(orgId: string, additional = 1) {
  const usage = await getOrgPlanUsage(orgId);
  return usage.staffUsers + additional <= usage.usersLimit;
}

export function planLimitMessage(
  resource: "property" | "unit" | "staff",
  usage: PlanUsage,
) {
  const labels = {
    property: {
      used: usage.properties,
      limit: usage.propertiesLimit,
      noun: "properties",
    },
    unit: {
      used: usage.units,
      limit: usage.unitsLimit,
      noun: "units",
    },
    staff: {
      used: usage.staffUsers,
      limit: usage.usersLimit,
      noun: "staff users",
    },
  } as const;

  const item = labels[resource];
  return `Your ${usage.plan} plan allows ${item.limit === Number.MAX_SAFE_INTEGER ? "unlimited" : item.limit} ${item.noun}. You currently have ${item.used}. Upgrade your plan from Organization Settings → Billing or contact platform support.`;
}

export async function assertCanCreateProperty(orgId: string, additional = 1) {
  const usage = await getOrgPlanUsage(orgId);
  if (usage.properties + additional > usage.propertiesLimit) {
    throw new Error(planLimitMessage("property", usage));
  }
  return usage;
}

export async function assertCanCreateUnit(orgId: string, additional = 1) {
  const usage = await getOrgPlanUsage(orgId);
  if (usage.units + additional > usage.unitsLimit) {
    throw new Error(planLimitMessage("unit", usage));
  }
  return usage;
}

export async function assertCanCreateStaffUser(orgId: string, additional = 1) {
  const usage = await getOrgPlanUsage(orgId);
  if (usage.staffUsers + additional > usage.usersLimit) {
    throw new Error(planLimitMessage("staff", usage));
  }
  return usage;
}
