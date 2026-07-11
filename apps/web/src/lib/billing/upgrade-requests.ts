import "server-only";

import { BillingPlan, Prisma, type SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { APP_PLANS, type AppPlan } from "@/lib/billing/plans";

export type UpgradeRequestRecord = {
  plan: AppPlan;
  notes: string | null;
  requestedAt: string | null;
  requestedByUserId: string | null;
  requestedByName: string | null;
  status: "PENDING" | "APPLIED" | "REJECTED" | string;
  amountDue: number | null;
  paymentReference: string | null;
};

export function parseUpgradeRequest(
  metadata: Prisma.JsonValue | null | undefined,
): UpgradeRequestRecord | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const raw = (metadata as Record<string, unknown>).upgradeRequest;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const req = raw as Record<string, unknown>;
  const planRaw = typeof req.plan === "string" ? req.plan.toUpperCase() : "";
  if (!(planRaw in APP_PLANS)) return null;

  return {
    plan: planRaw as AppPlan,
    notes: typeof req.notes === "string" ? req.notes : null,
    requestedAt: typeof req.requestedAt === "string" ? req.requestedAt : null,
    requestedByUserId:
      typeof req.requestedByUserId === "string" ? req.requestedByUserId : null,
    requestedByName:
      typeof req.requestedByName === "string" ? req.requestedByName : null,
    status: typeof req.status === "string" ? req.status : "PENDING",
    amountDue:
      typeof req.amountDue === "number" && Number.isFinite(req.amountDue)
        ? req.amountDue
        : APP_PLANS[planRaw as AppPlan].monthlyAmount,
    paymentReference:
      typeof req.paymentReference === "string" ? req.paymentReference : null,
  };
}

export function isPendingUpgradeRequest(
  metadata: Prisma.JsonValue | null | undefined,
) {
  const request = parseUpgradeRequest(metadata);
  return Boolean(request && request.status === "PENDING");
}

function asMetadataObject(
  metadata: Prisma.JsonValue | null | undefined,
): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return { ...(metadata as Record<string, unknown>) };
}

export async function listPendingUpgradeRequests(limit = 50) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      metadata: {
        path: ["upgradeRequest", "status"],
        equals: "PENDING",
      },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  // Fallback for providers that don't support JSON path filters reliably:
  // if none returned, scan recent subscriptions client-side.
  if (subscriptions.length === 0) {
    const recent = await prisma.subscription.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: {
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    return recent
      .map((sub) => {
        const request = parseUpgradeRequest(sub.metadata);
        if (!request || request.status !== "PENDING") return null;
        return { subscription: sub, request };
      })
      .filter(Boolean)
      .slice(0, limit) as Array<{
      subscription: (typeof recent)[number];
      request: UpgradeRequestRecord;
    }>;
  }

  return subscriptions
    .map((sub) => {
      const request = parseUpgradeRequest(sub.metadata);
      if (!request || request.status !== "PENDING") return null;
      return { subscription: sub, request };
    })
    .filter(Boolean) as Array<{
    subscription: (typeof subscriptions)[number];
    request: UpgradeRequestRecord;
  }>;
}

export async function applyUpgradeRequest(input: {
  orgId: string;
  actorUserId: string;
  paymentReference?: string | null;
  notes?: string | null;
  status?: SubscriptionStatus;
}) {
  const subscription = await prisma.subscription.findUnique({
    where: { orgId: input.orgId },
    include: {
      org: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!subscription?.org) {
    throw new Error("Subscription not found.");
  }

  const request = parseUpgradeRequest(subscription.metadata);
  if (!request || request.status !== "PENDING") {
    throw new Error("No pending upgrade request for this organization.");
  }

  if (!(request.plan in APP_PLANS)) {
    throw new Error("Invalid requested plan.");
  }

  const plan = request.plan as BillingPlan;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const status = input.status ?? "ACTIVE";
  const metadata = asMetadataObject(subscription.metadata);

  const appliedRequest = {
    ...request,
    status: "APPLIED",
    appliedAt: now.toISOString(),
    appliedByUserId: input.actorUserId,
    paymentReference: input.paymentReference ?? request.paymentReference,
    resolutionNotes: input.notes ?? null,
  };

  const nextMetadata = {
    ...metadata,
    upgradeRequest: appliedRequest,
    amountDue: 0,
    lastPaidAt: now.toISOString(),
    lastPaymentReference: input.paymentReference ?? null,
  };

  const updated = await prisma.subscription.update({
    where: { orgId: input.orgId },
    data: {
      plan,
      status,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelledAt: status === "CANCELLED" ? now : null,
      trialEndsAt: status === "TRIALING" ? periodEnd : null,
      metadata: nextMetadata as Prisma.InputJsonValue,
      planChanges: {
        create: {
          fromPlan: subscription.plan,
          toPlan: plan,
          effectiveFrom: now,
          reason:
            input.notes?.trim() ||
            `Upgrade request applied (payment confirmed)${
              input.paymentReference
                ? ` · ref ${input.paymentReference}`
                : ""
            }`,
        },
      },
    },
  });

  return {
    subscription: updated,
    org: subscription.org,
    fromPlan: subscription.plan,
    toPlan: plan,
    request: appliedRequest,
  };
}

export async function rejectUpgradeRequest(input: {
  orgId: string;
  actorUserId: string;
  notes?: string | null;
}) {
  const subscription = await prisma.subscription.findUnique({
    where: { orgId: input.orgId },
    include: {
      org: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!subscription?.org) {
    throw new Error("Subscription not found.");
  }

  const request = parseUpgradeRequest(subscription.metadata);
  if (!request || request.status !== "PENDING") {
    throw new Error("No pending upgrade request for this organization.");
  }

  const metadata = asMetadataObject(subscription.metadata);
  const rejected = {
    ...request,
    status: "REJECTED",
    rejectedAt: new Date().toISOString(),
    rejectedByUserId: input.actorUserId,
    resolutionNotes: input.notes ?? null,
  };

  await prisma.subscription.update({
    where: { orgId: input.orgId },
    data: {
      metadata: {
        ...metadata,
        upgradeRequest: rejected,
      } as Prisma.InputJsonValue,
    },
  });

  return {
    org: subscription.org,
    request: rejected,
    fromPlan: subscription.plan,
  };
}
