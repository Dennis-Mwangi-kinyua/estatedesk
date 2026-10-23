type Amount = { toString(): string } | number | string | null | undefined;
export type VacancyCostsInput = {
  rentAmount: Amount; depositAmount: Amount; serviceCharge: Amount;
  garbageFee: Amount; securityFee: Amount;
  viewingFeeRequired: boolean; viewingFeeAmount: Amount;
};
export function vacancyCosts(input: VacancyCostsInput) {
  const fields = [
    ["Rent", input.rentAmount], ["Deposit", input.depositAmount],
    ["Service charge", input.serviceCharge], ["Garbage fee", input.garbageFee], ["Security fee", input.securityFee],
    ...(input.viewingFeeRequired ? [["Viewing fee", input.viewingFeeAmount]] : []),
  ] as [string, Amount][];
  const rows = fields.map(([label, raw]) => {
    const value = raw == null || String(raw).trim() === "" ? NaN : Number(String(raw));
    return { label, amount: Number.isFinite(value) && value >= 0 ? value : null };
  });
  const knownMinor = rows.reduce((sum, row) => sum + (row.amount === null ? 0 : Math.round(row.amount * 100)), 0);
  return { rows, knownTotal: knownMinor / 100, complete: rows.every(row => row.amount !== null) };
}
