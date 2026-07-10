import { Prisma } from "@prisma/client";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { buildMpesaTransactionKey } from "@/lib/payments/transaction-reference";
import { getPlatformControl } from "@/lib/platform/control";

type CallbackItem = { Name?: string; Value?: string | number };

function callbackValue(items: CallbackItem[], name: string) {
  return items.find((item) => item.Name === name)?.Value;
}

async function recordWebhookSample(input: {
  statusCode: number;
  summary: string;
  payload?: unknown;
}) {
  try {
    const { prisma: db } = await import("@/lib/prisma");
    await db.platformWebhookEvent.create({
      data: {
        provider: "mpesa",
        path: "/api/webhooks/mpesa",
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

export async function POST(request: Request) {
  const control = await getPlatformControl();
  if (control.webhooksDisabled) {
    await recordWebhookSample({
      statusCode: 503,
      summary: "Rejected — webhooks disabled by platform control",
    });
    return Response.json(
      { ok: false, error: "Webhooks disabled by platform control" },
      { status: 503 },
    );
  }

  const expectedSecret = process.env.MPESA_CALLBACK_SECRET?.trim();
  if (expectedSecret) {
    const supplied = new URL(request.url).searchParams.get("secret");
    if (supplied !== expectedSecret) {
      await recordWebhookSample({
        statusCode: 401,
        summary: "Unauthorized callback secret",
      });
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const payload = (await request.json().catch(() => null)) as {
    Body?: {
      stkCallback?: {
        MerchantRequestID?: string;
        CheckoutRequestID?: string;
        ResultCode?: number;
        ResultDesc?: string;
        CallbackMetadata?: { Item?: CallbackItem[] };
      };
    };
  } | null;
  const callback = payload?.Body?.stkCallback;
  if (!callback?.CheckoutRequestID || typeof callback.ResultCode !== "number") {
    await recordWebhookSample({
      statusCode: 400,
      summary: "Invalid STK callback payload",
      payload,
    });
    return Response.json({ ok: false, error: "Invalid callback payload" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { checkoutRequestId: callback.CheckoutRequestID },
    select: { id: true, verificationStatus: true },
  });
  if (!payment) {
    await recordWebhookSample({
      statusCode: 200,
      summary: `Unmatched STK callback ${callback.CheckoutRequestID}`,
      payload: {
        CheckoutRequestID: callback.CheckoutRequestID,
        ResultCode: callback.ResultCode,
      },
    });
    return Response.json({ ok: true, matched: false });
  }

  const items = callback.CallbackMetadata?.Item ?? [];
  const receipt = String(callbackValue(items, "MpesaReceiptNumber") ?? "").toUpperCase();
  const amount = Number(callbackValue(items, "Amount") ?? 0);
  const phone = String(callbackValue(items, "PhoneNumber") ?? "");
  const transactionKey = receipt ? buildMpesaTransactionKey(receipt) : null;

  try {
    if (callback.ResultCode !== 0) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayStatus: "FAILED",
          verificationStatus: "REJECTED",
          reconciliationStatus: "DISPUTED",
          reconciliationNotes: callback.ResultDesc ?? "Daraja payment failed.",
          callbackRaw: payload as Prisma.InputJsonValue,
        },
      });
    } else {
      // Persist gateway success fields first, then auto-settle (allocate + receipt).
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          gatewayStatus: "SUCCESS",
          externalReference: receipt,
          transactionReferenceKey: transactionKey,
          phoneUsed: phone || undefined,
          paidAt: new Date(),
          callbackRaw: payload as Prisma.InputJsonValue,
          notes: `Daraja confirmed KES ${amount}. Auto-settling bill balances.`,
        },
      });

      const { settleGatewayPayment } = await import(
        "@/lib/payments/settle-payment"
      );
      await prisma.$transaction(async (tx) => {
        await settleGatewayPayment({
          db: tx,
          paymentId: payment.id,
        });
      });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ ok: false, error: "Duplicate M-Pesa receipt" }, { status: 409 });
    }

    logServerError("mpesa.webhook.update", error, { paymentId: payment.id });
    return Response.json({ ok: false, error: "Unable to process callback." }, { status: 500 });
  }

  await recordWebhookSample({
    statusCode: 200,
    summary: `Matched STK callback ${callback.CheckoutRequestID} result=${callback.ResultCode}`,
    payload: {
      CheckoutRequestID: callback.CheckoutRequestID,
      ResultCode: callback.ResultCode,
      paymentId: payment.id,
    },
  });

  return Response.json({ ok: true, matched: true });
}
