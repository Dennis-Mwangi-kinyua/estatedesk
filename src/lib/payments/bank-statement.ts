import { parseCsv } from "@/lib/csv";
import { normalizeTransactionReference } from "./transaction-reference";

export type BankStatementRow = {
  line: number;
  transactionId: string;
  amount: number;
  paidAt: Date;
  payerName: string;
  reference: string;
};

export function parseBankStatement(csv: string, limit = 5_000) {
  const rows = parseCsv(csv);
  if (rows.length > limit) throw new Error(`Bank statement exceeds ${limit} rows.`);

  return rows.map((row, index): BankStatementRow => {
    const line = index + 2;
    const transactionId = normalizeTransactionReference(
      row.transactionId ?? row.transaction_id ?? row.reference ?? "",
    );
    const amount = Number((row.amount ?? "").replace(/,/g, ""));
    const paidAt = new Date(row.paidAt ?? row.paid_at ?? row.date ?? "");
    if (!transactionId) throw new Error(`Line ${line}: transactionId is required.`);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Line ${line}: amount must be greater than zero.`);
    }
    if (Number.isNaN(paidAt.getTime())) throw new Error(`Line ${line}: paidAt/date is invalid.`);
    return {
      line,
      transactionId,
      amount,
      paidAt,
      payerName: (row.payerName ?? row.payer_name ?? "").trim(),
      reference: (row.reference ?? "").trim(),
    };
  });
}
