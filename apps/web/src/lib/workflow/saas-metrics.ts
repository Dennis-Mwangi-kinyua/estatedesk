export type PaymentBucket = {
  method: string;
  verificationStatus: string;
  gatewayStatus: string;
  count: number;
};

export type ChargeSnapshot = {
  createdAt: Date;
  updatedAt: Date;
  balance: number;
  status: string;
};

export type SaasMetrics = {
  hoursSignupToFirstUnit: number | null;
  daysFirstUnitToFirstBill: number | null;
  settledWithoutReview: number;
  pendingProofs: number;
  autoSettledShare: number | null;
  reconciledWithinSevenDays: number;
  eligibleBills: number;
  reconciledWithinSevenDaysShare: number | null;
  chargeSampleLimited: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * DAY_MS;

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function computeSaasMetrics(input: {
  organizationCreatedAt: Date;
  firstUnitAt: Date | null;
  firstChargeAt: Date | null;
  payments: PaymentBucket[];
  charges: ChargeSnapshot[];
  now?: Date;
  chargeSampleLimited?: boolean;
}): SaasMetrics {
  const now = input.now ?? new Date();
  const hoursSignupToFirstUnit = input.firstUnitAt
    ? round1(Math.max(0, input.firstUnitAt.getTime() - input.organizationCreatedAt.getTime()) / (60 * 60 * 1000))
    : null;
  const daysFirstUnitToFirstBill = input.firstUnitAt && input.firstChargeAt
    ? round1(Math.max(0, input.firstChargeAt.getTime() - input.firstUnitAt.getTime()) / DAY_MS)
    : null;

  let settledWithoutReview = 0;
  let pendingProofs = 0;
  for (const bucket of input.payments) {
    if (bucket.method === "MPESA_STK" && bucket.gatewayStatus === "SUCCESS" && bucket.verificationStatus === "NOT_REQUIRED") {
      settledWithoutReview += bucket.count;
    }
    if (bucket.verificationStatus === "PENDING" && ["MPESA_MANUAL", "BANK", "CASH"].includes(bucket.method)) {
      pendingProofs += bucket.count;
    }
  }
  const compared = settledWithoutReview + pendingProofs;

  let reconciledWithinSevenDays = 0;
  let eligibleBills = 0;
  for (const charge of input.charges) {
    const settled = charge.balance <= 0 || charge.status === "PAID" || charge.status === "WAIVED";
    const age = now.getTime() - charge.createdAt.getTime();
    if (!settled && age < SEVEN_DAYS_MS) continue;
    eligibleBills += 1;
    if (settled && charge.status !== "WAIVED" && charge.updatedAt.getTime() - charge.createdAt.getTime() <= SEVEN_DAYS_MS) {
      reconciledWithinSevenDays += 1;
    }
  }

  return {
    hoursSignupToFirstUnit,
    daysFirstUnitToFirstBill,
    settledWithoutReview,
    pendingProofs,
    autoSettledShare: compared > 0 ? settledWithoutReview / compared : null,
    reconciledWithinSevenDays,
    eligibleBills,
    reconciledWithinSevenDaysShare: eligibleBills > 0 ? reconciledWithinSevenDays / eligibleBills : null,
    chargeSampleLimited: input.chargeSampleLimited ?? false,
  };
}

export function formatMetricShare(value: number | null) {
  if (value === null) return "Not yet";
  return `${Math.round(value * 100)}%`;
}

export function formatMetricHours(value: number | null) {
  if (value === null) return "Not yet";
  if (value < 1) return "Under 1 hour";
  return `${value} hours`;
}

export function formatMetricDays(value: number | null) {
  if (value === null) return "Not yet";
  if (value < 1) return "Same day";
  return `${value} days`;
}
