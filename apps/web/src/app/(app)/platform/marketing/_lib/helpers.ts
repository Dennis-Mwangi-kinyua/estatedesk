import { APP_PLANS } from "@/lib/billing/plans";

export function toNumber(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

export function formatPercent(value: unknown) {
  return `${toNumber(value).toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  })}%`;
}

export function estimateMonthlyCommission({
  plan,
  rate,
}: {
  plan: keyof typeof APP_PLANS | null | undefined;
  rate: unknown;
}) {
  if (!plan) return 0;
  return (APP_PLANS[plan].monthlyAmount * toNumber(rate)) / 100;
}


