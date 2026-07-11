/**
 * Multi-bank / paybill virtual account aggregation helpers.
 *
 * Maps org payment instructions to bank rails (Equity, KCB, Co-op, I&M)
 * for commercial transfers. Live bank VA APIs remain provider-specific;
 * this module normalizes account endpoints for settlement matching.
 */

export type BankRail =
  | "equity"
  | "kcb"
  | "coop"
  | "im"
  | "family"
  | "mpesa_paybill"
  | "other";

export type VirtualAccountEndpoint = {
  rail: BankRail;
  label: string;
  /** Business / paybill / bank account number */
  accountNumber: string;
  /** Bank-specific branch or till */
  branchCode?: string | null;
  accountName?: string | null;
  /** Virtual account suffix or full VA for large commercial transfers */
  virtualAccountRef?: string | null;
  enabled: boolean;
};

export type OrgPaymentRailsInput = {
  mpesaPaybill?: string | null;
  mpesaAccountName?: string | null;
  kcbPaybillEnabled?: boolean | null;
  kcbPaybill?: string | null;
  kcbAccountNumber?: string | null;
  equityAccountNumber?: string | null;
  equityAccountName?: string | null;
  coopAccountNumber?: string | null;
  coopAccountName?: string | null;
  imAccountNumber?: string | null;
  imAccountName?: string | null;
  familyAccountNumber?: string | null;
  /** Org-level VA prefix for tenant-mapped virtual accounts */
  virtualAccountPrefix?: string | null;
};

const RAIL_LABELS: Record<BankRail, string> = {
  equity: "Equity Bank",
  kcb: "KCB Bank",
  coop: "Co-operative Bank",
  im: "I&M Bank",
  family: "Family Bank",
  mpesa_paybill: "M-Pesa Paybill",
  other: "Other bank",
};

/**
 * Build the set of enabled aggregation endpoints from org payment settings.
 */
export function buildVirtualAccountEndpoints(
  input: OrgPaymentRailsInput,
): VirtualAccountEndpoint[] {
  const endpoints: VirtualAccountEndpoint[] = [];

  if (input.mpesaPaybill?.trim()) {
    endpoints.push({
      rail: "mpesa_paybill",
      label: RAIL_LABELS.mpesa_paybill,
      accountNumber: input.mpesaPaybill.trim(),
      accountName: input.mpesaAccountName?.trim() || null,
      enabled: true,
    });
  }

  if (input.kcbPaybillEnabled && (input.kcbPaybill?.trim() || input.kcbAccountNumber?.trim())) {
    endpoints.push({
      rail: "kcb",
      label: RAIL_LABELS.kcb,
      accountNumber: (input.kcbAccountNumber || input.kcbPaybill || "").trim(),
      accountName: null,
      enabled: true,
    });
  }

  if (input.equityAccountNumber?.trim()) {
    endpoints.push({
      rail: "equity",
      label: RAIL_LABELS.equity,
      accountNumber: input.equityAccountNumber.trim(),
      accountName: input.equityAccountName?.trim() || null,
      enabled: true,
    });
  }

  if (input.coopAccountNumber?.trim()) {
    endpoints.push({
      rail: "coop",
      label: RAIL_LABELS.coop,
      accountNumber: input.coopAccountNumber.trim(),
      accountName: input.coopAccountName?.trim() || null,
      enabled: true,
    });
  }

  if (input.imAccountNumber?.trim()) {
    endpoints.push({
      rail: "im",
      label: RAIL_LABELS.im,
      accountNumber: input.imAccountNumber.trim(),
      accountName: input.imAccountName?.trim() || null,
      enabled: true,
    });
  }

  if (input.familyAccountNumber?.trim()) {
    endpoints.push({
      rail: "family",
      label: RAIL_LABELS.family,
      accountNumber: input.familyAccountNumber.trim(),
      enabled: true,
    });
  }

  return endpoints;
}

/**
 * Map a tenant/lease to a virtual account reference for bank transfer matching.
 * Pattern: {prefix}{compactTenantRef} — banks reconcile via narration or VA.
 */
export function buildTenantVirtualAccountRef(input: {
  prefix?: string | null;
  tenantPublicId?: string | null;
  unitHouseNo?: string | null;
  leaseId?: string | null;
}): string {
  const prefix = (input.prefix || "ED").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
  const seed =
    input.tenantPublicId ||
    input.unitHouseNo ||
    (input.leaseId ? input.leaseId.slice(-8) : "TENANT");
  const compact = String(seed)
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 12);
  return `${prefix}${compact}`;
}

/**
 * Match an inbound bank transfer narration/reference to a virtual account ref.
 */
export function matchTransferToVirtualAccount(
  narration: string,
  knownRefs: string[],
): string | null {
  const hay = narration.toUpperCase().replace(/\s+/g, "");
  for (const ref of knownRefs) {
    const needle = ref.toUpperCase().replace(/\s+/g, "");
    if (needle && hay.includes(needle)) return ref;
  }
  return null;
}

export function bankRailLabel(rail: BankRail): string {
  return RAIL_LABELS[rail] ?? RAIL_LABELS.other;
}

/**
 * Map org payment-instruction JSON into multi-bank virtual account endpoints.
 */
export function endpointsFromPaymentInstructions(instructions: {
  mpesaPaybill?: string | null;
  mpesaAccountName?: string | null;
  kcbPaybillEnabled?: boolean | null;
  kcbPaybill?: string | null;
  kcbAccountNumber?: string | null;
  bankAccounts?: Record<
    string,
    {
      accountNumber?: string | null;
      accountName?: string | null;
      businessName?: string | null;
    }
  > | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  bankName?: string | null;
  virtualAccountPrefix?: string | null;
}): VirtualAccountEndpoint[] {
  const banks = instructions.bankAccounts ?? {};
  return buildVirtualAccountEndpoints({
    mpesaPaybill: instructions.mpesaPaybill,
    mpesaAccountName: instructions.mpesaAccountName,
    kcbPaybillEnabled: instructions.kcbPaybillEnabled,
    kcbPaybill: instructions.kcbPaybill,
    kcbAccountNumber: instructions.kcbAccountNumber,
    equityAccountNumber:
      banks.equity?.accountNumber ||
      (instructions.bankName?.toLowerCase().includes("equity")
        ? instructions.bankAccountNumber
        : null),
    equityAccountName: banks.equity?.accountName || banks.equity?.businessName,
    coopAccountNumber: banks.coop?.accountNumber || banks["co-op"]?.accountNumber,
    coopAccountName: banks.coop?.accountName || banks["co-op"]?.accountName,
    imAccountNumber: banks.im?.accountNumber || banks["i&m"]?.accountNumber,
    imAccountName: banks.im?.accountName,
    familyAccountNumber: banks.family?.accountNumber,
    virtualAccountPrefix: instructions.virtualAccountPrefix,
  });
}

/**
 * Suggest a settlement targetType / bank rail from transfer narration.
 */
export function classifyInboundTransfer(input: {
  narration: string;
  amount: number;
  knownVirtualRefs: string[];
  endpoints: VirtualAccountEndpoint[];
}): {
  matchedRef: string | null;
  suggestedRail: BankRail | null;
  confidence: "high" | "medium" | "low";
} {
  const matchedRef = matchTransferToVirtualAccount(
    input.narration,
    input.knownVirtualRefs,
  );
  const hay = input.narration.toLowerCase();
  let suggestedRail: BankRail | null = null;
  if (/mpesa|m-pesa|paybill|till/.test(hay)) suggestedRail = "mpesa_paybill";
  else if (/equity/.test(hay)) suggestedRail = "equity";
  else if (/\bkcb\b|kenya commercial/.test(hay)) suggestedRail = "kcb";
  else if (/co-?op|cooperative/.test(hay)) suggestedRail = "coop";
  else if (/i\s*&\s*m|imbank/.test(hay)) suggestedRail = "im";
  else if (/family/.test(hay)) suggestedRail = "family";

  if (!suggestedRail && input.endpoints.length === 1) {
    suggestedRail = input.endpoints[0].rail;
  }

  return {
    matchedRef,
    suggestedRail,
    confidence: matchedRef ? "high" : suggestedRail ? "medium" : "low",
  };
}
