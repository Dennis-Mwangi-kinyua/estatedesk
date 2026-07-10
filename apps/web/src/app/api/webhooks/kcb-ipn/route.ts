import { Prisma } from "@prisma/client";
import { logServerError } from "@/lib/errors/server-error-log";
import {
  kcbIpnAck,
  kcbIpnAmount,
  parseKcbIpnPayload,
  verifyKcbIpnSignature,
} from "@/lib/kcb/ipn";
import { matchKcbIpnPayment } from "@/lib/kcb/match-ipn-payment";
import { getPlatformControl } from "@/lib/platform/control";
import { prisma } from "@/lib/prisma";

async function recordWebhookSample(input: {
  statusCode: number;
  summary: string;
  payload?: unknown;
}) {
  try {
    await prisma.platformWebhookEvent.create({
      data: {
        provider: "kcb-buni-ipn",
        path: "/api/webhooks/kcb-ipn",
        statusCode: input.statusCode,
        summary: input.summary,
        payload:
          input.payload && typeof input.payload === "object"
            ? (input.payload as object)
            : undefined,
      },
    });
  } catch {
    // Optional debug table may be missing before migration.
  }
}

/**
 * KCB Buni Instant Payment Notification receiver.
 * KCB POSTs credit notifications here; we must ack with { transactionID, statusCode, statusMessage }.
 */
export async function POST(request: Request) {
  const control = await getPlatformControl();
  if (control.webhooksDisabled) {
    await recordWebhookSample({
      statusCode: 503,
      summary: "Rejected — webhooks disabled by platform control",
    });
    return Response.json(
      kcbIpnAck("UNKNOWN", 503, "Webhooks disabled by platform control"),
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const url = new URL(request.url);
  const signatureHeader =
    request.headers.get("signature") ??
    request.headers.get("Signature") ??
    request.headers.get("x-kcb-signature");

  const auth = verifyKcbIpnSignature({
    rawBody,
    signatureHeader,
    querySecret: url.searchParams.get("secret"),
    expectedSecret: process.env.KCB_BUNI_IPN_SIGNATURE_SECRET,
  });

  if (!auth.ok) {
    await recordWebhookSample({
      statusCode: 401,
      summary: auth.reason ?? "Unauthorized KCB IPN signature",
    });
    return Response.json(kcbIpnAck("UNKNOWN", 401, "Unauthorized"), {
      status: 401,
    });
  }

  let rawJson: unknown = null;
  try {
    rawJson = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    await recordWebhookSample({
      statusCode: 400,
      summary: "Invalid JSON body",
    });
    return Response.json(kcbIpnAck("UNKNOWN", 400, "Invalid JSON body"), {
      status: 400,
    });
  }

  const notification = parseKcbIpnPayload(rawJson);
  if (!notification) {
    await recordWebhookSample({
      statusCode: 400,
      summary: "Invalid KCB IPN payload",
      payload: rawJson,
    });
    return Response.json(kcbIpnAck("UNKNOWN", 400, "Invalid notification payload"), {
      status: 400,
    });
  }

  const txnId = notification.transactionReference;
  const amount = kcbIpnAmount(notification);

  try {
    const { payment, transactionKey, matchStrategy } = await matchKcbIpnPayment(
      prisma,
      notification,
    );

    if (!payment) {
      await recordWebhookSample({
        statusCode: 200,
        summary: `Unmatched KCB IPN ${txnId} amount=${amount}`,
        payload: {
          transactionReference: txnId,
          customerReference: notification.customerReference,
          creditAccountIdentifier: notification.creditAccountIdentifier,
          organizationShortCode: notification.organizationShortCode,
          amount,
        },
      });
      // Ack success so KCB does not retry endlessly; ops can reconcile unmatched samples.
      return Response.json(
        kcbIpnAck(txnId, 0, "Notification received (unmatched)"),
      );
    }

    if (payment.verificationStatus === "VERIFIED") {
      await recordWebhookSample({
        statusCode: 200,
        summary: `KCB IPN ${txnId} for already-verified payment ${payment.id}`,
        payload: { paymentId: payment.id, transactionReference: txnId },
      });
      return Response.json(kcbIpnAck(txnId, 0, "Already verified"));
    }

    if (payment.verificationStatus === "REJECTED") {
      await recordWebhookSample({
        statusCode: 200,
        summary: `KCB IPN ${txnId} for rejected payment ${payment.id}`,
        payload: { paymentId: payment.id, transactionReference: txnId },
      });
      return Response.json(kcbIpnAck(txnId, 0, "Payment previously rejected"));
    }

    const phone = notification.customerMobileNumber?.trim() || undefined;
    const paidAt = parseKcbTimestamp(notification.timestamp) ?? new Date();

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayStatus: "SUCCESS",
        verificationStatus: "PENDING",
        externalReference: normalizeRef(notification.transactionReference),
        transactionReferenceKey: transactionKey,
        phoneUsed: phone,
        paidAt,
        callbackRaw: {
          provider: "kcb-buni-ipn",
          matchStrategy,
          notification: rawJson,
        } as Prisma.InputJsonValue,
        notes: [
          payment.externalReference
            ? undefined
            : `KCB IPN confirmed KES ${amount}`,
          notification.customerName
            ? `Payer: ${notification.customerName}`
            : undefined,
          notification.narration ? `Narration: ${notification.narration}` : undefined,
          "Awaiting organization verification before receipt.",
        ]
          .filter(Boolean)
          .join(" "),
      },
    });

    await recordWebhookSample({
      statusCode: 200,
      summary: `Matched KCB IPN ${txnId} → payment ${payment.id} (${matchStrategy})`,
      payload: {
        paymentId: payment.id,
        orgId: payment.orgId,
        transactionReference: txnId,
        matchStrategy,
        amount,
      },
    });

    return Response.json(kcbIpnAck(txnId, 0, "Notification received"));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await recordWebhookSample({
        statusCode: 200,
        summary: `Duplicate KCB txn ${txnId}`,
        payload: { transactionReference: txnId },
      });
      // Idempotent ack — transaction already applied under another payment row race.
      return Response.json(kcbIpnAck(txnId, 0, "Duplicate transaction already recorded"));
    }

    logServerError("kcb.ipn.webhook", error, {
      transactionReference: txnId,
    });
    await recordWebhookSample({
      statusCode: 500,
      summary: `KCB IPN processing error for ${txnId}`,
      payload: { transactionReference: txnId },
    });
    return Response.json(kcbIpnAck(txnId, 500, "Unable to process notification"), {
      status: 500,
    });
  }
}

function normalizeRef(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function parseKcbTimestamp(value: string | number | undefined): Date | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // Sample format from docs: "2021111103005" (YYYYMMDDHHmm?) — best-effort
  if (/^\d{12,14}$/.test(raw)) {
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6)) - 1;
    const day = Number(raw.slice(6, 8));
    const hour = Number(raw.slice(8, 10));
    const minute = Number(raw.slice(10, 12));
    const second = raw.length >= 14 ? Number(raw.slice(12, 14)) : 0;
    const date = new Date(year, month, day, hour, minute, second);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
