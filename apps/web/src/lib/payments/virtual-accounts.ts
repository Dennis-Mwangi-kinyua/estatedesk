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
