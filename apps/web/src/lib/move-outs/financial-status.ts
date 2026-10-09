export function financialStatus(owedCents: number, refundPending: boolean) {
  return owedCents > 0 ? "BALANCE_DUE" : refundPending ? "REFUND_PENDING" : "SETTLED";
}
