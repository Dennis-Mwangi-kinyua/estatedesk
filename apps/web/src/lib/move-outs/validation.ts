import { moneyCents, calculateSettlement, parseCostItems } from "./settlement";
export function nairobiDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}
export function parseMoveOutDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Choose a valid move-out date.");
  const date = new Date(`${value}T00:00:00+03:00`);
  if (!Number.isFinite(date.getTime()) || nairobiDate(date) !== value) throw new Error("Choose a valid move-out date.");
  return date;
}
export function parseInspectionDate(value: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Choose a valid inspection date and time.");
  parseMoveOutDate(value.slice(0, 10));
  if (Number(value.slice(11, 13)) > 23 || Number(value.slice(14)) > 59) throw new Error("Choose a valid inspection time.");
  const date = new Date(`${value}:00+03:00`);
  if (date <= now) throw new Error("Schedule the inspection in the future (Nairobi time).");
  return date;
}
export function parseCloseout(form: FormData, now = new Date(), outstandingBillsCents = 0) {
  const actualMoveOutDate = parseMoveOutDate(String(form.get("actualMoveOutDate") ?? ""));
  if (nairobiDate(actualMoveOutDate) > nairobiDate(now)) throw new Error("Handover cannot be recorded for a future date.");
  if (form.get("keysReturned") !== "on" || form.get("balancesReviewed") !== "on") throw new Error("Confirm key handover and the final balance review before closing.");
  const depositHeld = moneyCents(form.get("depositHeld"), "deposit held");
  const itemised = form.has("costItems");
  const legacyDeductions = itemised ? 0 : moneyCents(form.get("deductions"), "deductions");
  if (!itemised && legacyDeductions > depositHeld) throw new Error("Deposit deductions cannot exceed the deposit held.");
  const costs = itemised ? parseCostItems(form.get("costItems")) : legacyDeductions > 0 ? [{ description: "Agreed deductions", amount: legacyDeductions / 100 }] : [];
  const calculated = calculateSettlement(depositHeld, outstandingBillsCents, costs);
  const notes = String(form.get("notes") ?? "").trim();
  if (!notes || notes.length > 2000) throw new Error("Add closeout notes (up to 2,000 characters), including the final balance and any deductions.");
  const refundStatus = String(form.get("refundStatus") ?? "");
  if (!["PENDING", "REFUNDED", "NOT_DUE"].includes(refundStatus)) throw new Error("Select the deposit refund status.");
  const refundDue = Math.round(calculated.refundDue * 100);
  if ((refundDue > 0 && refundStatus === "NOT_DUE") || (refundDue === 0 && refundStatus !== "NOT_DUE")) throw new Error("The refund status must match the amount due.");
  return { actualMoveOutDate, notes, settlement: { ...calculated, refundStatus, keysReturned: true, balancesReviewed: true } };
}
