export function paymentReconciliationBlocker(payment: {
  verificationStatus: string;
  gatewayStatus: string;
  reversedAt?: Date | null;
}): string | null {
  if (payment.verificationStatus === "REVERSED" || payment.reversedAt) return "Reversed payments cannot be reconciled.";
  if (payment.verificationStatus === "REJECTED") return "Rejected payments cannot be reconciled.";
  if (payment.verificationStatus !== "VERIFIED" && payment.verificationStatus !== "NOT_REQUIRED") return "Verify this payment before marking it reconciled.";
  if (payment.gatewayStatus !== "SUCCESS") return "Payment must be confirmed successful before reconciliation.";
  return null;
}
