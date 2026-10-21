import "server-only";

import { prisma } from "@/lib/prisma";
import { APP_PLANS, type AppPlan } from "@/lib/billing/plans";
import type { Prisma } from "@prisma/client";

const PLAN_ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING"]);
type BillingReadClient = Pick<Prisma.TransactionClient, "subscription" | "property" | "unit" | "bnbListing" | "membership">;

/** Serialize quota checks and writes for one organization across all creation paths. */
export async function lockOrgQuota(tx: Prisma.TransactionClient, orgId: string) {
  await tx.$queryRaw`SELECT "id" FROM "Organization" WHERE "id" = ${orgId} FOR UPDATE`;
}

export type PlanUsage = {
  plan: AppPlan;
  properties: number;
  units: number;
  staffUsers: number;
  propertiesLimit: number;
  unitsLimit: number;
  usersLimit: number;
};

export async function getOrgPlan(orgId: string, client: BillingReadClient = prisma): Promise<AppPlan> {
  const subscription = await client.subscription.findUnique({
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

export async function getOrgPlanUsage(orgId: string, client: BillingReadClient = prisma): Promise<PlanUsage> {
  const [plan, properties, physicalUnits, bnbListings, staffUsers] = await Promise.all([
    getOrgPlan(orgId, client),
    client.property.count({
      where: { orgId, deletedAt: null },
    }),
    client.unit.count({
      where: {
        deletedAt: null,
        property: { orgId, deletedAt: null },
      },
    }),
    client.bnbListing.count({ where: { orgId, deletedAt: null } }),
    client.membership.count({
      where: {
        orgId,
        deactivatedAt: null,
        employmentEndedAt: null,
        role: {
          in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "SECURITY"],
        },
        user: { deletedAt: null },
      },
    }),
  ]);

  const limits = APP_PLANS[plan];
  // A managed short-stay listing consumes the same portfolio capacity as a unit.
  const units = physicalUnits + bnbListings;

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
  const nextPlan = usage.plan === "FREE" ? "Pro" : usage.plan === "PRO" ? "Plus" : usage.plan === "PLUS" ? "Custom" : null;
  const upgrade = nextPlan
    ? ` Upgrade to ${nextPlan} from Organization Settings → Billing${nextPlan === "Custom" ? " or contact platform support" : ""}.`
    : " Contact platform support to review your custom limit.";
  const detail = resource === "unit" ? " (units and BnB listings combined)" : "";
  const planName = APP_PLANS[usage.plan].name;
  return `Your ${planName} plan allows ${item.limit === Number.MAX_SAFE_INTEGER ? "unlimited" : item.limit} ${item.noun}${detail}. You currently have ${item.used}.${upgrade}`;
}

export async function assertCanCreateProperty(orgId: string, additional = 1, client: BillingReadClient = prisma) {
  const usage = await getOrgPlanUsage(orgId, client);
  if (usage.properties + additional > usage.propertiesLimit) {
    throw new Error(planLimitMessage("property", usage));
  }
  return usage;
}

export async function assertCanCreateUnit(orgId: string, additional = 1, client: BillingReadClient = prisma) {
  const usage = await getOrgPlanUsage(orgId, client);
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
