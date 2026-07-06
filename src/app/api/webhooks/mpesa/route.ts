import { Prisma } from "@prisma/client";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { buildMpesaTransactionKey } from "@/lib/payments/transaction-reference";

type CallbackItem = { Name?: string; Value?: string | number };

function callbackValue(items: CallbackItem[], name: string) {
  return items.find((item) => item.Name === name)?.Value;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.MPESA_CALLBACK_SECRET?.trim();
  if (expectedSecret) {
    const supplied = new URL(request.url).searchParams.get("secret");
    if (supplied !== expectedSecret) return new Response("Unauthorized", { status: 401 });
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
    return Response.json({ ok: false, error: "Invalid callback payload" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { checkoutRequestId: callback.CheckoutRequestID },
    select: { id: true, verificationStatus: true },
  });
  if (!payment) return Response.json({ ok: true, matched: false });

  const items = callback.CallbackMetadata?.Item ?? [];
  const receipt = String(callbackValue(items, "MpesaReceiptNumber") ?? "").toUpperCase();
  const amount = Number(callbackValue(items, "Amount") ?? 0);
  const phone = String(callbackValue(items, "PhoneNumber") ?? "");
  const transactionKey = receipt ? buildMpesaTransactionKey(receipt) : null;

  try {
    await prisma.payment.update({
      where: { id: payment.id },
      data:
        callback.ResultCode === 0
          ? {
              gatewayStatus: "SUCCESS",
              verificationStatus: "PENDING",
              externalReference: receipt,
              transactionReferenceKey: transactionKey,
              phoneUsed: phone || undefined,
              paidAt: new Date(),
              callbackRaw: payload as Prisma.InputJsonValue,
              notes: `Daraja confirmed KES ${amount}; awaiting allocation verification.`,
            }
          : {
              gatewayStatus: "FAILED",
              verificationStatus: "REJECTED",
              reconciliationStatus: "DISPUTED",
              reconciliationNotes: callback.ResultDesc ?? "Daraja payment failed.",
              callbackRaw: payload as Prisma.InputJsonValue,
            },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ ok: false, error: "Duplicate M-Pesa receipt" }, { status: 409 });
    }

    logServerError("mpesa.webhook.update", error, { paymentId: payment.id });
    return Response.json({ ok: false, error: "Unable to process callback." }, { status: 500 });
  }

  return Response.json({ ok: true, matched: true });
}
