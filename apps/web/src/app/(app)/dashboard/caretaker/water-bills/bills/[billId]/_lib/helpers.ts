export const BILL_DETAIL_LOAD_ERROR_MESSAGE =
  "We couldn't load this water bill right now. Please refresh the page or try again in a few minutes.";

export function billStatusTone(status: string) {
  if (status === "PAID_VERIFIED") return "green" as const;
  if (status === "PENDING_APPROVAL") return "blue" as const;
  if (status === "PAYMENT_PENDING" || status === "PAID_PENDING_VERIFICATION") {
    return "red" as const;
  }
  if (status === "ISSUED") return "violet" as const;
  return "neutral" as const;
}

export function paymentStatusTone(
  gatewayStatus: string,
  verificationStatus: string,
) {
  if (verificationStatus === "VERIFIED") return "green" as const;
  if (verificationStatus === "REJECTED") return "red" as const;
  if (gatewayStatus === "SUCCESS") return "blue" as const;
  return "neutral" as const;
}