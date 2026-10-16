import { APP_PLANS } from "./plans";

/** Read-only price display; free plans and unset custom pricing do not require an invoice amount. */
export function subscriptionDisplayAmount(plan: keyof typeof APP_PLANS, metadata: unknown): number | null {
  const custom = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? (metadata as {amountDue?:unknown}).amountDue : undefined;
  if (typeof custom === "number" && custom !== 0) return Number.isFinite(custom) && custom > 0 ? custom : null;
  const amount = APP_PLANS[plan].monthlyAmount;
  return amount > 0 || plan === "FREE" ? amount : null;
}
