import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { getPlatformControl } from "@/lib/platform/control";

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
  if (!expectedSecret || !process.env.MPESA_ORG_ID?.trim()) {
    return Response.json({ ok: false, error: "M-Pesa callback is not configured." }, { status: 503 });
  }
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
        CallbackMetadata?: { Item?: { Name?: string; Value?: string | number }[] };
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

  try {
    const { settleMpesaCallback } = await import("@/lib/mpesa/settle-callback");
    const result = await prisma.$transaction(tx => settleMpesaCallback(tx, process.env.MPESA_ORG_ID!.trim(), callback as import("@/lib/mpesa/settle-callback").StkCallback), { isolationLevel: "Serializable", timeout: 30_000 });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    logServerError("mpesa.webhook.settle", error);
    return Response.json({ ok: false, error: "Unable to process callback. Retry required." }, { status: 500 });
  }
}
