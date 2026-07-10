export type ParsedJournalLine = {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
};

export function parseJournalLinesPayload(raw: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Journal lines payload is invalid.");
  }

  if (!Array.isArray(parsed) || parsed.length < 2) {
    throw new Error("A journal entry requires at least two lines.");
  }

  const lines: ParsedJournalLine[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      throw new Error("Each journal line must be an object.");
    }

    const record = item as Record<string, unknown>;
    const accountId = String(record.accountId ?? "").trim();
    const debit = Number(record.debit ?? 0);
    const credit = Number(record.credit ?? 0);
    const description =
      typeof record.description === "string" ? record.description.trim() : undefined;

    if (!accountId) {
      throw new Error("Each journal line needs an account.");
    }

    if (!Number.isFinite(debit) || !Number.isFinite(credit)) {
      throw new Error("Journal line amounts must be numbers.");
    }

    if (debit < 0 || credit < 0) {
      throw new Error("Journal line amounts cannot be negative.");
    }

    if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
      throw new Error("Each journal line must have either a debit or a credit.");
    }

    lines.push({
      accountId,
      description,
      debit,
      credit,
    });
  }

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.009) {
    throw new Error(
      `Journal is not balanced: debits ${totalDebit.toFixed(2)}, credits ${totalCredit.toFixed(2)}.`,
    );
  }

  return lines;
}