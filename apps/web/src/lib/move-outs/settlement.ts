export type MoveOutCost = { description: string; amount: number };
export function moneyCents(value: unknown, label: string) {
  const text = String(value ?? "").trim();
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text)) throw new Error(`Enter a non-negative ${label} with at most two decimal places.`);
  return Math.round(Number(text) * 100);
}
export function calculateSettlement(depositCents: number, billCents: number, costs: MoveOutCost[]) {
  const costCents = costs.reduce((sum, item) => sum + moneyCents(item.amount, "cost"), 0);
  const totalCents = billCents + costCents;
  return { depositHeld: depositCents / 100, outstandingBills: billCents / 100, itemisedCosts: costs, additionalCosts: costCents / 100, totalCosts: totalCents / 100, deductions: Math.min(depositCents, totalCents) / 100, refundDue: Math.max(0, depositCents - totalCents) / 100, amountOwed: Math.max(0, totalCents - depositCents) / 100 };
}
export function parseCostItems(raw: unknown): MoveOutCost[] {
  let items: unknown;
  try { items = JSON.parse(String(raw)); } catch { throw new Error("Invalid itemised costs. Refresh and try again."); }
  if (!Array.isArray(items) || items.length > 30) throw new Error("Use at most 30 itemised costs.");
  return items.map(item => {
    if (!item || typeof item !== "object" || typeof item.description !== "string" || !item.description.trim() || item.description.trim().length > 200) throw new Error("Describe every cost (up to 200 characters).");
    const cents = moneyCents(item.amount, "cost");
    if (cents === 0) throw new Error("Every itemised cost must be greater than zero.");
    return { description: item.description.trim(), amount: cents / 100 };
  });
}
