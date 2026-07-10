/**
 * Platform catalog of tenant payment methods.
 * Orgs opt into a subset; tenants only see methods enabled for their org.
 *
 * settlement:
 * - gateway → auto-clears / reduces bill when payment succeeds (e.g. STK)
 * - manual  → pending until organization verifies pasted proof
 */

export type PaymentMethodKind = "gateway" | "mobile_money" | "bank" | "manual";
export type PaymentSettlementMode = "gateway" | "manual";

export type PaymentMethodDefinition = {
  id: string;
  name: string;
  type: PaymentMethodKind;
  settlement: PaymentSettlementMode;
  description: string;
  accent: string;
  logoText: string;
};

export const PAYMENT_METHOD_CATALOG: PaymentMethodDefinition[] = [
  {
    id: "mpesa-stk",
    name: "M-Pesa STK Push",
    type: "gateway",
    settlement: "gateway",
    description:
      "Instant paybill prompt on your phone. Successful payments clear or reduce your bill automatically.",
    accent: "from-green-500 to-emerald-600",
    logoText: "STK",
  },
  {
    id: "manual-mpesa",
    name: "Manual M-Pesa",
    type: "manual",
    settlement: "manual",
    description:
      "Pay via Lipa na M-Pesa, then paste the SMS or 10-character code. Awaits organization verification.",
    accent: "from-emerald-600 to-teal-700",
    logoText: "M",
  },
  {
    id: "manual-bank",
    name: "Manual bank transfer",
    type: "manual",
    settlement: "manual",
    description:
      "Transfer to the organization bank account, then paste the reference. Awaits organization verification.",
    accent: "from-slate-600 to-slate-900",
    logoText: "BK",
  },
  {
    id: "mpesa",
    name: "M-Pesa (paybill / till)",
    type: "mobile_money",
    settlement: "manual",
    description: "Pay via Safaricom M-Pesa Paybill or Till, then submit the confirmation code",
    accent: "from-green-500 to-emerald-600",
    logoText: "M",
  },
  {
    id: "airtel-money",
    name: "Airtel Money",
    type: "mobile_money",
    settlement: "manual",
    description: "Pay with Airtel Money, then submit the confirmation code for verification",
    accent: "from-red-500 to-rose-600",
    logoText: "A",
  },
  {
    id: "kcb",
    name: "KCB Paybill",
    type: "bank",
    settlement: "manual",
    description: "Pay via M-Pesa to KCB paybill (e.g. 522522), then submit the code",
    accent: "from-green-700 to-green-900",
    logoText: "KCB",
  },
  {
    id: "equity",
    name: "Equity Bank",
    type: "bank",
    settlement: "manual",
    description: "Secure payments via Equity Bank",
    accent: "from-red-700 to-red-900",
    logoText: "EQ",
  },
  {
    id: "coop",
    name: "Co-operative Bank",
    type: "bank",
    settlement: "manual",
    description: "Pay using Co-operative Bank channels",
    accent: "from-blue-700 to-sky-900",
    logoText: "CO-OP",
  },
  {
    id: "absa",
    name: "Absa Bank Kenya",
    type: "bank",
    settlement: "manual",
    description: "Convenient card and bank transfer payments",
    accent: "from-red-500 to-orange-600",
    logoText: "ABSA",
  },
  {
    id: "stanbic",
    name: "Stanbic Bank Kenya",
    type: "bank",
    settlement: "manual",
    description: "Pay through Stanbic Bank services",
    accent: "from-sky-600 to-blue-800",
    logoText: "SB",
  },
  {
    id: "ncba",
    name: "NCBA Bank",
    type: "bank",
    settlement: "manual",
    description: "Quick payments with NCBA Bank",
    accent: "from-purple-700 to-indigo-900",
    logoText: "NCBA",
  },
  {
    id: "family",
    name: "Family Bank",
    type: "bank",
    settlement: "manual",
    description: "Reliable Family Bank payment option",
    accent: "from-orange-500 to-amber-700",
    logoText: "FB",
  },
  {
    id: "i-and-m",
    name: "I&M Bank",
    type: "bank",
    settlement: "manual",
    description: "Pay securely using I&M Bank",
    accent: "from-teal-600 to-cyan-800",
    logoText: "I&M",
  },
  {
    id: "dtb",
    name: "Diamond Trust Bank",
    type: "bank",
    settlement: "manual",
    description: "Easy checkout with DTB",
    accent: "from-indigo-600 to-blue-900",
    logoText: "DTB",
  },
  {
    id: "standard-chartered",
    name: "Standard Chartered Kenya",
    type: "bank",
    settlement: "manual",
    description: "International-standard secure bank payments",
    accent: "from-green-500 to-blue-700",
    logoText: "SC",
  },
  {
    id: "prime",
    name: "Prime Bank",
    type: "bank",
    settlement: "manual",
    description: "Pay through Prime Bank",
    accent: "from-cyan-600 to-sky-700",
    logoText: "PB",
  },
  {
    id: "sidian",
    name: "Sidian Bank",
    type: "bank",
    settlement: "manual",
    description: "Simple and secure Sidian Bank payment flow",
    accent: "from-fuchsia-600 to-purple-800",
    logoText: "SB",
  },
  {
    id: "kingdom",
    name: "Kingdom Bank",
    type: "bank",
    settlement: "manual",
    description: "Make your payment through Kingdom Bank",
    accent: "from-emerald-500 to-lime-700",
    logoText: "KB",
  },
  {
    id: "gulf-african",
    name: "Gulf African Bank",
    type: "bank",
    settlement: "manual",
    description: "Pay with Gulf African Bank",
    accent: "from-amber-600 to-orange-800",
    logoText: "GAB",
  },
  {
    id: "ecobank",
    name: "Ecobank Kenya",
    type: "bank",
    settlement: "manual",
    description: "Secure payment option via Ecobank",
    accent: "from-blue-500 to-indigo-700",
    logoText: "ECO",
  },
  {
    id: "credit-bank",
    name: "Credit Bank",
    type: "bank",
    settlement: "manual",
    description: "Card and account payment support",
    accent: "from-slate-600 to-slate-900",
    logoText: "CB",
  },
  {
    id: "uba",
    name: "United Bank for Africa",
    type: "bank",
    settlement: "manual",
    description: "Pay using UBA banking services",
    accent: "from-red-600 to-red-800",
    logoText: "UBA",
  },
  {
    id: "spire",
    name: "Spire Bank",
    type: "bank",
    settlement: "manual",
    description: "Convenient payment access through Spire Bank",
    accent: "from-yellow-500 to-orange-700",
    logoText: "SPIRE",
  },
];

const catalogById = new Map(
  PAYMENT_METHOD_CATALOG.map((item) => [item.id, item] as const),
);

export function getPaymentMethodDefinition(id: string) {
  return catalogById.get(id) ?? null;
}

export function isKnownPaymentMethodId(id: string) {
  return catalogById.has(id);
}

export function isBankCatalogMethod(id: string) {
  const def = catalogById.get(id);
  return Boolean(def && def.type === "bank" && id !== "kcb");
}

export function isMobileMoneyMethod(id: string) {
  return catalogById.get(id)?.type === "mobile_money";
}

/** Match free-text bank name from legacy settings to a catalog id. */
export function matchBankNameToMethodId(bankName: string) {
  const normalized = bankName.trim().toLowerCase();
  if (!normalized) return null;

  const aliases: Array<{ id: string; needles: string[] }> = [
    { id: "equity", needles: ["equity"] },
    { id: "coop", needles: ["co-op", "coop", "co-operative", "cooperative"] },
    { id: "absa", needles: ["absa", "barclays"] },
    { id: "stanbic", needles: ["stanbic"] },
    { id: "ncba", needles: ["ncba"] },
    { id: "family", needles: ["family"] },
    { id: "i-and-m", needles: ["i&m", "i and m", "i-and-m"] },
    { id: "dtb", needles: ["diamond trust", "dtb"] },
    {
      id: "standard-chartered",
      needles: ["standard chartered", "stanchart"],
    },
    { id: "prime", needles: ["prime bank", "prime"] },
    { id: "sidian", needles: ["sidian"] },
    { id: "kingdom", needles: ["kingdom"] },
    { id: "gulf-african", needles: ["gulf african", "gulf"] },
    { id: "ecobank", needles: ["ecobank"] },
    { id: "credit-bank", needles: ["credit bank"] },
    { id: "uba", needles: ["united bank", "uba"] },
    { id: "spire", needles: ["spire"] },
    // KCB bank transfer (not paybill) — only when name is clearly KCB bank account.
    { id: "kcb-bank", needles: [] },
  ];

  for (const alias of aliases) {
    if (alias.needles.some((needle) => normalized.includes(needle))) {
      return alias.id;
    }
  }

  // Generic "KCB" without "paybill" maps to equity-style bank transfer under catalog...
  // We use equity list without kcb-bank id; kcb is reserved for paybill.
  if (normalized.includes("kcb") && !normalized.includes("paybill")) {
    // Treat as a bank account labeled under a synthetic id stored as "kcb-transfer"
    // Prefer mapping to family of banks: use equity? No — use "kcb" only for paybill.
    // Legacy bank name "KCB Bank" → enable bank method via bankAccounts key "kcb-transfer"
    return "kcb-transfer";
  }

  return null;
}

export const METHOD_LABELS: Record<string, string> = Object.fromEntries(
  PAYMENT_METHOD_CATALOG.map((item) => [item.id, item.name]),
);

// Allow legacy / synthetic ids in labels
METHOD_LABELS["kcb-transfer"] = "KCB Bank Transfer";
