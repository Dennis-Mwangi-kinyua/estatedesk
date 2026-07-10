export type GlMatchCandidate = {
  id: string;
  amount: number;
  entryDate: Date;
  description: string;
  memo?: string | null;
};

export type StatementMatchRow = {
  line: number;
  transactionId: string;
  amount: number;
  paidAt: Date;
  payerName: string;
};

export function scoreGlStatementMatch(
  row: StatementMatchRow,
  candidate: GlMatchCandidate,
  dayTolerance = 3,
) {
  const amountDelta = Math.abs(Math.abs(candidate.amount) - row.amount);
  if (amountDelta > 0.01) return -1;

  const dayDelta =
    Math.abs(candidate.entryDate.getTime() - row.paidAt.getTime()) /
    (1000 * 60 * 60 * 24);
  if (dayDelta > dayTolerance) return -1;

  const haystack = `${candidate.description} ${candidate.memo ?? ""}`.toLowerCase();
  const refHit = row.transactionId
    ? haystack.includes(row.transactionId.toLowerCase())
    : false;
  const payerHit = row.payerName
    ? haystack.includes(row.payerName.toLowerCase())
    : false;

  let score = 100 - dayDelta;
  if (refHit) score += 40;
  if (payerHit) score += 20;
  return score;
}

export function matchStatementRowsToGlLines(
  rows: StatementMatchRow[],
  candidates: GlMatchCandidate[],
) {
  const used = new Set<string>();
  const matches: Array<{ row: StatementMatchRow; journalLineId: string }> = [];
  const unmatched: StatementMatchRow[] = [];

  for (const row of rows) {
    let best: { id: string; score: number } | null = null;

    for (const candidate of candidates) {
      if (used.has(candidate.id)) continue;
      const score = scoreGlStatementMatch(row, candidate);
      if (score < 0) continue;
      if (!best || score > best.score) {
        best = { id: candidate.id, score };
      }
    }

    if (!best) {
      unmatched.push(row);
      continue;
    }

    used.add(best.id);
    matches.push({ row, journalLineId: best.id });
  }

  return { matches, unmatched };
}