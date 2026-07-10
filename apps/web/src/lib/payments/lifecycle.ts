export function chargeAfterPaymentReversal({
  amountDue,
  amountPaid,
  allocationAmount,
}: {
  amountDue: number;
  amountPaid: number;
  allocationAmount: number;
}) {
  const nextPaid = Math.max(0, amountPaid - allocationAmount);
  const nextBalance = Math.max(0, amountDue - nextPaid);
  const status = nextPaid <= 0 ? "UNPAID" : nextBalance <= 0 ? "PAID" : "PARTIAL";
  return { amountPaid: nextPaid, balance: nextBalance, status } as const;
}
