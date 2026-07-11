/**
 * Combined period payment hierarchy.
 *
 * Service-related charges (service, garbage, security) and water clear first;
 * rent is always last so partial M-Pesa payments keep utilities current.
 *
 * Lower rank = higher priority (applied earlier).
 */

export type AllocatableChargeType =
  | "RENT"
  | "DEPOSIT"
  | "WATER"
  | "PENALTY"
  | "SERVICE_CHARGE"
  | "OTHER"
  | string;

export type AllocationBucket =
  | "SERVICE_CHARGE"
  | "GARBAGE"
  | "SECURITY"
  | "PENALTY"
  | "WATER"
  | "OTHER"
  | "DEPOSIT"
  | "RENT";

/** Rank map: lower number is applied first. */
export const ALLOCATION_PRIORITY: Record<AllocationBucket, number> = {
  SERVICE_CHARGE: 10,
  GARBAGE: 20,
  SECURITY: 30,
  PENALTY: 40,
  WATER: 50,
  OTHER: 60,
  DEPOSIT: 70,
  RENT: 90,
};

const GARBAGE_HINT = /garbage|refuse|waste|collection/i;
const SECURITY_HINT = /security|guard|watchman|askari/i;
const SERVICE_HINT = /service\s*charge|service\s*fee|service\b/i;

/**
 * Classify a lease charge (or synthetic line) into an allocation bucket.
 * OTHER charges are split into service / garbage / security via description.
 */
export function classifyChargeForAllocation(
  chargeType: AllocatableChargeType,
  description?: string | null,
): AllocationBucket {
  const type = String(chargeType || "OTHER").toUpperCase();
  const desc = description ?? "";

  if (type === "RENT") return "RENT";
  if (type === "WATER") return "WATER";
  if (type === "PENALTY") return "PENALTY";
  if (type === "DEPOSIT") return "DEPOSIT";
  if (type === "SERVICE_CHARGE") {
    // Combined "service + security" descriptions still rank as service tier.
    if (SECURITY_HINT.test(desc) && !SERVICE_HINT.test(desc)) return "SECURITY";
    return "SERVICE_CHARGE";
  }

  if (type === "OTHER" || type === "GARBAGE" || type === "SECURITY") {
    if (type === "GARBAGE" || GARBAGE_HINT.test(desc)) return "GARBAGE";
    if (type === "SECURITY" || SECURITY_HINT.test(desc)) return "SECURITY";
    if (SERVICE_HINT.test(desc)) return "SERVICE_CHARGE";
    // Default bare OTHER (legacy) treats as garbage utility fee.
    if (!desc.trim()) return "GARBAGE";
    return "OTHER";
  }

  if (SERVICE_HINT.test(desc)) return "SERVICE_CHARGE";
  return "OTHER";
}

export function allocationPriorityRank(
  chargeType: AllocatableChargeType,
  description?: string | null,
): number {
  const bucket = classifyChargeForAllocation(chargeType, description);
  return ALLOCATION_PRIORITY[bucket] ?? ALLOCATION_PRIORITY.OTHER;
}

/**
 * Sort open charges so service/garbage/security/penalties apply before rent.
 * Water bills are handled separately after non-rent charges and before rent.
 */
export function compareChargesForAllocation(
  a: { chargeType: AllocatableChargeType; description?: string | null; dueDate?: Date | string | null },
  b: { chargeType: AllocatableChargeType; description?: string | null; dueDate?: Date | string | null },
): number {
  const rankDiff =
    allocationPriorityRank(a.chargeType, a.description) -
    allocationPriorityRank(b.chargeType, b.description);
  if (rankDiff !== 0) return rankDiff;

  const aDue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
  const bDue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
  return aDue - bDue;
}

/** Partition charges into pre-water (utilities/fees) vs rent-last groups. */
export function partitionChargesAroundWater<
  T extends { chargeType: AllocatableChargeType; description?: string | null },
>(charges: T[]): { beforeWater: T[]; rentLast: T[] } {
  const beforeWater: T[] = [];
  const rentLast: T[] = [];

  for (const charge of charges) {
    const bucket = classifyChargeForAllocation(
      charge.chargeType,
      charge.description,
    );
    if (bucket === "RENT" || bucket === "DEPOSIT") {
      rentLast.push(charge);
    } else {
      beforeWater.push(charge);
    }
  }

  beforeWater.sort(compareChargesForAllocation);
  rentLast.sort(compareChargesForAllocation);
  return { beforeWater, rentLast };
}

/** Display order for period bill lines (same hierarchy as allocation). */
export function sortPeriodBillLinesForDisplay<
  T extends { kind: string; label?: string },
>(lines: T[]): T[] {
  return [...lines].sort((a, b) => {
    const aType =
      a.kind === "WATER"
        ? "WATER"
        : a.kind === "RENT"
          ? "RENT"
          : a.kind === "OTHER"
            ? "OTHER"
            : a.kind;
    const bType =
      b.kind === "WATER"
        ? "WATER"
        : b.kind === "RENT"
          ? "RENT"
          : b.kind === "OTHER"
            ? "OTHER"
            : b.kind;
    return (
      allocationPriorityRank(aType, a.label) -
      allocationPriorityRank(bType, b.label)
    );
  });
}

/** Human labels for UI / receipts. */
export function allocationBucketLabel(bucket: AllocationBucket): string {
  switch (bucket) {
    case "SERVICE_CHARGE":
      return "Service charge";
    case "GARBAGE":
      return "Garbage fee";
    case "SECURITY":
      return "Security fee";
    case "PENALTY":
      return "Penalty";
    case "WATER":
      return "Water";
    case "DEPOSIT":
      return "Deposit";
    case "RENT":
      return "Rent";
    default:
      return "Other charge";
  }
}
