import type { calculateSettlement } from "./settlement";
export function settlementApprovalKey(settlement: ReturnType<typeof calculateSettlement>, date: string) {
  return JSON.stringify({ date, depositHeld: settlement.depositHeld, outstandingBills: settlement.outstandingBills, itemisedCosts: settlement.itemisedCosts, amountOwed: settlement.amountOwed });
}
