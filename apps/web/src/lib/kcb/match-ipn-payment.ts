import type { Prisma, PrismaClient } from "@prisma/client";
import {
  buildKcbIpnTransactionKey,
  kcbIpnAmount,
  kcbIpnMatchCandidates,
  normalizeKcbAccountToken,
  type KcbIpnNotification,
} from "@/lib/kcb/ipn";
import { parsePaymentInstructions } from "@/lib/payments/instructions";

export type MatchedKcbPayment = {
  id: string;
  orgId: string;
  verificationStatus: string;
  amount: Prisma.Decimal;
  externalReference: string | null;
  reference: string | null;
  transactionReferenceKey: string | null;
};

type PaymentDb = Pick<PrismaClient, "payment" | "organizationSettings">;

/**
 * Find a pending payment that this KCB IPN should update.
 * Match order:
 * 1. Existing transactionReferenceKey for this KCB txn
 * 2. externalReference / reference equals transactionReference or customerReference
 * 3. Org with matching KCB account/paybill + pending payment of same amount
 */
export async function matchKcbIpnPayment(
  db: PaymentDb,
  notification: KcbIpnNotification,
): Promise<{
  payment: MatchedKcbPayment | null;
  transactionKey: string;
  matchStrategy: string | null;
}> {
  const amount = kcbIpnAmount(notification);
  const candidates = kcbIpnMatchCandidates(notification);
  const accountTokens = [
    notification.creditAccountIdentifier,
    notification.organizationShortCode,
    notification.tillNumber,
  ]
    .map((value) => normalizeKcbAccountToken(value))
    .filter(Boolean);

  const transactionKey = buildKcbIpnTransactionKey(
    notification,
    accountTokens[0],
  );

  // Resolve the receiving account to one organization before looking at
  // payments. Payment references and amounts can repeat across organizations.
  const settings = accountTokens.length
    ? await db.organizationSettings.findMany({
        select: { orgId: true, customFields: true },
      })
    : [];
  const orgsByAccount = new Map<string, Set<string>>();
  for (const row of settings) {
    const instructions = parsePaymentInstructions(row.customFields);
    const tokens = [
      instructions.kcbAccountNumber,
      instructions.kcbPaybill,
      instructions.bankAccountNumber,
      ...Object.values(instructions.bankAccounts).map((account) => account.accountNumber),
    ].map(normalizeKcbAccountToken).filter(Boolean);
    for (const token of tokens) {
      const orgIds = orgsByAccount.get(token) ?? new Set<string>();
      orgIds.add(row.orgId);
      orgsByAccount.set(token, orgIds);
    }
  }
  // The credit account is the most specific identifier; generic paybill
  // numbers may be shared by many organizations.
  const matchedAccount = accountTokens
    .map((token) => ({ token, orgIds: orgsByAccount.get(token) }))
    .find((match) => match.orgIds?.size === 1);
  const orgId = matchedAccount?.orgIds
    ? [...matchedAccount.orgIds][0]
    : null;

  const byKey = await db.payment.findFirst({
    where: { transactionReferenceKey: transactionKey },
    select: matchSelect,
  });
  if (byKey && orgId && byKey.orgId === orgId) {
    return { payment: byKey, transactionKey, matchStrategy: "transaction_key" };
  }

  if (candidates.length > 0 && orgId) {
    const byExternal = await db.payment.findMany({
      where: {
        orgId,
        OR: [
          { externalReference: { in: candidates } },
          { reference: { in: candidates } },
        ],
        verificationStatus: { in: ["PENDING", "NOT_REQUIRED"] },
        gatewayStatus: { in: ["PENDING", "INITIATED", "SUCCESS"] },
      },
      select: matchSelect,
      take: 2,
    });
    if (byExternal.length === 1) {
      return {
        payment: byExternal[0],
        transactionKey,
        matchStrategy: "external_or_payment_reference",
      };
    }
  }

  // Amount + org KCB account match for recent pending BANK payments
  if (amount > 0 && orgId) {
    const recentPending = await db.payment.findMany({
      where: {
        orgId,
        method: "BANK",
        verificationStatus: "PENDING",
        gatewayStatus: { in: ["PENDING", "INITIATED"] },
        amount,
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
      select: {
        ...matchSelect,
        orgId: true,
      },
    });

    if (recentPending.length === 1) {
      return {
        payment: recentPending[0],
        transactionKey: buildKcbIpnTransactionKey(notification, matchedAccount?.token),
        matchStrategy: "amount_and_org_kcb_account",
      };
    }
  }

  return { payment: null, transactionKey, matchStrategy: null };
}

const matchSelect = {
  id: true,
  orgId: true,
  verificationStatus: true,
  amount: true,
  externalReference: true,
  reference: true,
  transactionReferenceKey: true,
} as const;
