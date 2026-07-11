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
  metadata: unknown,
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

export function isPendingUpgradeRequest(metadata: unknown) {
  const request = parseUpgradeRequest(metadata);
  return Boolean(request && request.status === "PENDING");
}
