import { Prisma } from "@prisma/client";

export function computeVariance(budgeted: number, actual: number) {
  const variance = actual - budgeted;
  const variancePct = budgeted !== 0 ? (variance / budgeted) * 100 : null;
  return { variance, variancePct };
}

export function reconciliationVariance(statementBalance: number, glBalance: number) {
  return new Prisma.Decimal(statementBalance).minus(glBalance).toDecimalPlaces(2);
}