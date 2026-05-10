import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { APP_PLANS } from "@/lib/billing/plans";

const GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type SubscriptionAccessState =
  | {
      status: "ok";
      plan: keyof typeof APP_PLANS;
      amountDue: number;
      trialEndsAt: Date | null;
      graceEndsAt: Date | null;
      daysLeft: number | null;
    }
  | {
      status: "grace";
      plan: keyof typeof APP_PLANS;
      amountDue: number;
      trialEndsAt: Date;
      graceEndsAt: Date;
      daysLeft: number;
    }
  | {
      status: "blocked";
      plan: keyof typeof APP_PLANS;
      amountDue: number;
      trialEndsAt: Date | null;
      graceEndsAt: Date | null;
      daysLeft: 0;
    };

function normalizePlan(plan: string | null | undefined): keyof typeof APP_PLANS {
  return plan && plan in APP_PLANS ? (plan as keyof typeof APP_PLANS) : "FREE";
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export async function getSubscriptionAccessState(
  orgId: string,
): Promise<SubscriptionAccessState> {
  const subscription = await prisma.subscription.findUnique({
    where: { orgId },
    select: {
      plan: true,
      status: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      metadata: true,
    },
  });

  const plan = normalizePlan(subscription?.plan);
  const amountDue =
    Number(
      (subscription?.metadata as { amountDue?: number } | null | undefined)
        ?.amountDue,
    ) || APP_PLANS[plan].monthlyAmount;

  if (!subscription) {
    return {
      status: "blocked",
      plan,
      amountDue,
      trialEndsAt: null,
      graceEndsAt: null,
      daysLeft: 0,
    };
  }

  if (subscription.status === "ACTIVE") {
    return {
      status: "ok",
      plan,
      amountDue,
      trialEndsAt: subscription.trialEndsAt,
      graceEndsAt: null,
      daysLeft: null,
    };
  }

  if (subscription.status === "TRIALING" && subscription.trialEndsAt) {
    const now = new Date();

    if (subscription.trialEndsAt > now) {
      return {
        status: "ok",
        plan,
        amountDue,
        trialEndsAt: subscription.trialEndsAt,
        graceEndsAt: addDays(subscription.trialEndsAt, GRACE_DAYS),
        daysLeft: Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / DAY_MS),
      };
    }

    const graceEndsAt = addDays(subscription.trialEndsAt, GRACE_DAYS);

    if (graceEndsAt > now) {
      return {
        status: "grace",
        plan,
        amountDue,
        trialEndsAt: subscription.trialEndsAt,
        graceEndsAt,
        daysLeft: Math.max(
          1,
          Math.ceil((graceEndsAt.getTime() - now.getTime()) / DAY_MS),
        ),
      };
    }
  }

  return {
    status: "blocked",
    plan,
    amountDue,
    trialEndsAt: subscription.trialEndsAt,
    graceEndsAt: subscription.trialEndsAt
      ? addDays(subscription.trialEndsAt, GRACE_DAYS)
      : subscription.currentPeriodEnd,
    daysLeft: 0,
  };
}

export async function requireActiveSubscription(orgId: string) {
  const access = await getSubscriptionAccessState(orgId);

  if (access.status === "blocked") {
    redirect("/dashboard/billing-required");
  }

  return access;
}

export function formatBillingAmount(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}
