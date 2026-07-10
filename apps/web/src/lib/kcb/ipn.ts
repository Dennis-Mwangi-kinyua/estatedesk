import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import {
  buildBankTransactionKey,
  normalizeTransactionReference,
} from "@/lib/payments/transaction-reference";

/**
 * KCB Buni Instant Payment Notification payload (credit notification).
 * @see https://sandbox.buni.kcbgroup.com/devportal/apis — InstantPaymentNotification
 */
export const kcbIpnNotificationSchema = z
  .object({
    transactionReference: z.string().min(1),
    requestId: z.string().optional(),
    channelCode: z.union([z.string(), z.number()]).optional(),
    timestamp: z.union([z.string(), z.number()]).optional(),
    transactionAmount: z.union([z.string(), z.number()]),
    currency: z.string().optional(),
    customerReference: z.string().optional(),
    customerName: z.string().optional(),
    customerMobileNumber: z.string().optional(),
    balance: z.union([z.string(), z.number()]).optional(),
    narration: z.string().optional(),
    creditAccountIdentifier: z.string().optional(),
    organizationShortCode: z.string().optional(),
    tillNumber: z.string().optional(),
  })
  .passthrough();

export type KcbIpnNotification = z.infer<typeof kcbIpnNotificationSchema>;

export type KcbIpnAck = {
  transactionID: string;
  statusCode: number;
  statusMessage: string;
};

export function parseKcbIpnPayload(raw: unknown): KcbIpnNotification | null {
  const result = kcbIpnNotificationSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function kcbIpnAmount(notification: KcbIpnNotification): number {
  const amount = Number(notification.transactionAmount);
  return Number.isFinite(amount) ? amount : 0;
}

export function buildKcbIpnTransactionKey(
  notification: KcbIpnNotification,
  accountHint?: string,
) {
  const account =
    accountHint ||
    notification.creditAccountIdentifier ||
    notification.organizationShortCode ||
    notification.tillNumber ||
    "KCB";

  return buildBankTransactionKey({
    bankName: "KCB",
    accountNumber: account,
    reference: notification.transactionReference,
  });
}

export function normalizeKcbAccountToken(value: string | null | undefined) {
  return (value ?? "").replace(/\D+/g, "");
}

/**
 * Verify KCB IPN authenticity.
 * Supports:
 * - HMAC-SHA256 of raw body (hex or base64) in `Signature` / `x-kcb-signature`
 * - Shared secret via `?secret=` query param (ops convenience, like M-Pesa)
 *
 * When no secret is configured, verification is skipped (dev/sandbox).
 */
export function verifyKcbIpnSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  querySecret: string | null;
  expectedSecret: string | undefined;
}): { ok: boolean; reason?: string } {
  const expected = input.expectedSecret?.trim();
  if (!expected) {
    return { ok: true };
  }

  if (input.querySecret && input.querySecret === expected) {
    return { ok: true };
  }

  const header = input.signatureHeader?.trim();
  if (!header) {
    return { ok: false, reason: "Missing Signature header" };
  }

  const normalizedHeader = header.replace(/^sha256=/i, "").trim();
  const digestHex = createHmac("sha256", expected)
    .update(input.rawBody, "utf8")
    .digest("hex");
  const digestBase64 = createHmac("sha256", expected)
    .update(input.rawBody, "utf8")
    .digest("base64");

  if (
    safeEqualString(normalizedHeader, digestHex) ||
    safeEqualString(normalizedHeader, digestBase64) ||
    safeEqualString(header, digestHex) ||
    safeEqualString(header, digestBase64)
  ) {
    return { ok: true };
  }

  // Some setups send the shared secret itself in Signature
  if (safeEqualString(header, expected)) {
    return { ok: true };
  }

  return { ok: false, reason: "Invalid Signature" };
}

function safeEqualString(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function kcbIpnAck(
  transactionId: string,
  statusCode: number,
  statusMessage: string,
): KcbIpnAck {
  return {
    transactionID: transactionId || "UNKNOWN",
    statusCode,
    statusMessage,
  };
}

/** Candidate references used to match a pending EstateDesk payment. */
export function kcbIpnMatchCandidates(notification: KcbIpnNotification) {
  const refs = [
    notification.transactionReference,
    notification.customerReference,
    notification.requestId,
  ]
    .filter((value): value is string => Boolean(value && String(value).trim()))
    .map((value) => normalizeTransactionReference(String(value)));

  return [...new Set(refs.filter(Boolean))];
}
