export function mpesaFailureMessage(resultCode: number, description?: string) {
  if (resultCode === 1037) {
    return "M-Pesa could not reach your phone. Check the Safaricom number and SIM network coverage, then retry.";
  }
  if (resultCode === 1032) {
    return "The M-Pesa request was cancelled. You can retry when ready.";
  }
  return description?.trim() || "M-Pesa could not complete this payment. Check the request status before trying again.";
}
