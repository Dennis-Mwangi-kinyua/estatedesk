import type { Prisma, PrismaClient } from "@prisma/client";
import {
  buildKcbIpnTransactionKey,
  kcbIpnAmount,
  kcbIpnMatchCandidates,
  normalizeKcbAccountToken,
  type KcbIpnNotification,
} from "@/lib/kcb/ipn";
import {
  parsePaymentInstructions,
  resolveEnabledMethods,
} from "@/lib/payments/instructions";

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

  const byKey = await db.payment.findFirst({
    where: { transactionReferenceKey: transactionKey },
    select: matchSelect,
  });
  if (byKey) {
    return { payment: byKey, transactionKey, matchStrategy: "transaction_key" };
  }

  if (candidates.length > 0) {
    const byExternal = await db.payment.findFirst({
      where: {
        OR: [
          { externalReference: { in: candidates } },
          { reference: { in: candidates } },
        ],
        verificationStatus: { in: ["PENDING", "NOT_REQUIRED"] },
        gatewayStatus: { in: ["PENDING", "INITIATED", "SUCCESS"] },
      },
      orderBy: { createdAt: "desc" },
      select: matchSelect,
    });
    if (byExternal) {
      return {
        payment: byExternal,
        transactionKey,
        matchStrategy: "external_or_payment_reference",
      };
    }
  }

  // Amount + org KCB account match for recent pending BANK payments
  if (amount > 0 && accountTokens.length > 0) {
    const recentPending = await db.payment.findMany({
      where: {
        method: "BANK",
        verificationStatus: "PENDING",
        gatewayStatus: { in: ["PENDING", "INITIATED"] },
        amount,
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        ...matchSelect,
        orgId: true,
      },
    });

    if (recentPending.length > 0) {
      const orgIds = [...new Set(recentPending.map((row) => row.orgId))];
      const settings = await db.organizationSettings.findMany({
        where: { orgId: { in: orgIds } },
        select: { orgId: true, customFields: true },
      });

      const orgByAccount = new Map<string, string>();
      for (const row of settings) {
        const instructions = parsePaymentInstructions(row.customFields);
        const enabled = resolveEnabledMethods(instructions);
        if (!enabled.includes("kcb") && !enabled.some((id) => id.startsWith("kcb"))) {
          // Still allow match if KCB account numbers are configured
        }

        const tokens = [
          instructions.kcbAccountNumber,
          instructions.kcbPaybill,
          instructions.bankAccountNumber,
          ...Object.values(instructions.bankAccounts).flatMap((account) => [
            account.accountNumber,
          ]),
        ]
          .map((value) => normalizeKcbAccountToken(value))
          .filter(Boolean);

        for (const token of tokens) {
          orgByAccount.set(token, row.orgId);
        }
      }

      for (const token of accountTokens) {
        const orgId = orgByAccount.get(token);
        if (!orgId) continue;
        const payment = recentPending.find((row) => row.orgId === orgId);
        if (payment) {
          return {
            payment,
            transactionKey: buildKcbIpnTransactionKey(notification, token),
            matchStrategy: "amount_and_org_kcb_account",
          };
        }
      }
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
