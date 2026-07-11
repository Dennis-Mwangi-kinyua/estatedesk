/**
 * Embedded hardware / local material price index.
 *
 * Background check for maintenance quotes vs a local index to flag caretaker
 * or vendor overpricing. Index can be seeded from config or a remote feed later.
 */

export type MaterialCategory =
  | "plumbing"
  | "electrical"
  | "paint"
  | "hardware"
  | "carpentry"
  | "tiling"
  | "general";

export type PriceIndexItem = {
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  /** Typical market mid price in KES */
  midPriceKes: number;
  /** Acceptable high band (above this = flag) */
  maxFairPriceKes: number;
  region?: string;
  updatedAt: string;
};

export type QuoteLineCheck = {
  description: string;
  quantity: number;
  unitPriceKes: number;
  /** Optional SKU match against index */
  sku?: string | null;
  category?: MaterialCategory | null;
};

export type QuoteVerificationResult = {
  lineResults: Array<{
    description: string;
    quantity: number;
    unitPriceKes: number;
    matchedSku: string | null;
    indexMid: number | null;
    indexMax: number | null;
    variancePct: number | null;
    status: "ok" | "watch" | "flag" | "unknown";
    note: string;
  }>;
  overallStatus: "ok" | "watch" | "flag" | "unknown";
  flaggedLines: number;
  estimatedFairTotal: number | null;
  quoteTotal: number;
  summary: string;
};

/** Default Nairobi-oriented material mid-band (indicative, not a live feed). */
export const DEFAULT_LOCAL_PRICE_INDEX: PriceIndexItem[] = [
  {
    sku: "PIPE-PVC-1",
    name: "PVC pipe 1 inch (6m)",
    category: "plumbing",
    unit: "length",
    midPriceKes: 650,
    maxFairPriceKes: 900,
    region: "Nairobi",
    updatedAt: "2026-06-01",
  },
  {
    sku: "TAP-MIX-STD",
    name: "Standard mixer tap",
    category: "plumbing",
    unit: "pcs",
    midPriceKes: 1800,
    maxFairPriceKes: 2800,
    region: "Nairobi",
    updatedAt: "2026-06-01",
  },
  {
    sku: "CABLE-2.5",
    name: "Electrical cable 2.5mm (m)",
    category: "electrical",
    unit: "m",
    midPriceKes: 120,
    maxFairPriceKes: 180,
    region: "Nairobi",
    updatedAt: "2026-06-01",
  },
  {
    sku: "PAINT-20L",
    name: "Emulsion paint 20L",
    category: "paint",
    unit: "bucket",
    midPriceKes: 4500,
    maxFairPriceKes: 6200,
    region: "Nairobi",
    updatedAt: "2026-06-01",
  },
  {
    sku: "CEMENT-50",
    name: "Cement 50kg",
    category: "hardware",
    unit: "bag",
    midPriceKes: 850,
    maxFairPriceKes: 1100,
    region: "Nairobi",
    updatedAt: "2026-06-01",
  },
  {
    sku: "TILE-ADH-20",
    name: "Tile adhesive 20kg",
    category: "tiling",
    unit: "bag",
    midPriceKes: 1200,
    maxFairPriceKes: 1700,
    region: "Nairobi",
    updatedAt: "2026-06-01",
  },
  {
    sku: "LOCK-CYL",
    name: "Cylinder door lock",
    category: "hardware",
    unit: "pcs",
    midPriceKes: 1500,
    maxFairPriceKes: 2400,
    region: "Nairobi",
    updatedAt: "2026-06-01",
  },
  {
    sku: "SWITCH-1G",
    name: "1-gang light switch",
    category: "electrical",
    unit: "pcs",
    midPriceKes: 250,
    maxFairPriceKes: 450,
    region: "Nairobi",
    updatedAt: "2026-06-01",
  },
];

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function matchIndexItem(
  line: QuoteLineCheck,
  index: PriceIndexItem[] = DEFAULT_LOCAL_PRICE_INDEX,
): PriceIndexItem | null {
  if (line.sku) {
    const bySku = index.find(
      (item) => item.sku.toLowerCase() === line.sku!.toLowerCase(),
    );
    if (bySku) return bySku;
  }

  const desc = normalize(line.description);
  if (!desc) return null;

  let best: PriceIndexItem | null = null;
  let bestScore = 0;

  for (const item of index) {
    if (line.category && item.category !== line.category) continue;
    const name = normalize(item.name);
    const tokens = name.split(" ").filter((t) => t.length > 2);
    const hits = tokens.filter((t) => desc.includes(t)).length;
    const score = hits / Math.max(tokens.length, 1);
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      best = item;
    }
  }

  return best;
}

export function verifyMaintenanceQuote(
  lines: QuoteLineCheck[],
  index: PriceIndexItem[] = DEFAULT_LOCAL_PRICE_INDEX,
): QuoteVerificationResult {
  const lineResults = lines.map((line) => {
    const match = matchIndexItem(line, index);
    const quoteLineTotal = line.quantity * line.unitPriceKes;

    if (!match) {
      return {
        description: line.description,
        quantity: line.quantity,
        unitPriceKes: line.unitPriceKes,
        matchedSku: null,
        indexMid: null,
        indexMax: null,
        variancePct: null,
        status: "unknown" as const,
        note: "No local index match — review manually.",
      };
    }

    const variancePct =
      match.midPriceKes > 0
        ? ((line.unitPriceKes - match.midPriceKes) / match.midPriceKes) * 100
        : 0;

    let status: "ok" | "watch" | "flag" = "ok";
    let note = `Within fair band for ${match.name}.`;

    if (line.unitPriceKes > match.maxFairPriceKes) {
      status = "flag";
      note = `Above max fair price (KES ${match.maxFairPriceKes}) for ${match.name}.`;
    } else if (line.unitPriceKes > match.midPriceKes * 1.15) {
      status = "watch";
      note = `15%+ above mid-market for ${match.name}.`;
    }

    return {
      description: line.description,
      quantity: line.quantity,
      unitPriceKes: line.unitPriceKes,
      matchedSku: match.sku,
      indexMid: match.midPriceKes,
      indexMax: match.maxFairPriceKes,
      variancePct: Math.round(variancePct * 10) / 10,
      status,
      note,
      // keep total for fair estimate calc via closure below
      _fair: match.midPriceKes * line.quantity,
      _quote: quoteLineTotal,
    };
  });

  const quoteTotal = lines.reduce(
    (s, l) => s + l.quantity * l.unitPriceKes,
    0,
  );

  const matched = lineResults.filter((r) => r.matchedSku);
  const estimatedFairTotal =
    matched.length > 0
      ? matched.reduce((s, r) => s + ((r as { _fair?: number })._fair ?? 0), 0)
      : null;

  const flaggedLines = lineResults.filter((r) => r.status === "flag").length;
  const watchLines = lineResults.filter((r) => r.status === "watch").length;

  let overallStatus: QuoteVerificationResult["overallStatus"] = "ok";
  if (matched.length === 0) overallStatus = "unknown";
  else if (flaggedLines > 0) overallStatus = "flag";
  else if (watchLines > 0) overallStatus = "watch";

  const cleaned = lineResults.map(
    ({ description, quantity, unitPriceKes, matchedSku, indexMid, indexMax, variancePct, status, note }) => ({
      description,
      quantity,
      unitPriceKes,
      matchedSku,
      indexMid,
      indexMax,
      variancePct,
      status,
      note,
    }),
  );

  const summary =
    overallStatus === "flag"
      ? `${flaggedLines} line(s) exceed local fair-price band — investigate before approving.`
      : overallStatus === "watch"
        ? "Some lines are elevated vs mid-market; confirm with second quote."
        : overallStatus === "unknown"
          ? "Could not match items to local index; manual review required."
          : "Quote is within the local material index band.";

  return {
    lineResults: cleaned,
    overallStatus,
    flaggedLines,
    estimatedFairTotal,
    quoteTotal,
    summary,
  };
}
