import { PayloadTooLargeError, readBoundedText } from "@/lib/security/bounded-json";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { verifyEtimsWebhookSignature } from "@/lib/tax/etims-client";

/**
 * KRA eTIMS callback / status webhook.
 * Validates HMAC when KRA_ETIMS_WEBHOOK_SECRET is set.
 */
export async function POST(request: Request) {
  try {
    const raw = await readBoundedText(request, 1_000_000);
    const signature =
      request.headers.get("x-kra-signature") ||
      request.headers.get("x-etims-signature") ||
      request.headers.get("x-signature");

    const secret = process.env.KRA_ETIMS_WEBHOOK_SECRET?.trim();
    if (process.env.NODE_ENV === "production" && !secret) {
      await recordEvent(503, "Rejected — eTIMS webhook authentication is not configured");
      return Response.json({ ok: false, error: "Webhook authentication is not configured" }, { status: 503 });
    }
    if (secret && !verifyEtimsWebhookSignature(raw, signature)) {
      await recordEvent(401, "Invalid eTIMS webhook signature");
      return Response.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    let body: unknown = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = { raw: raw.slice(0, 500) };
    }

    await recordEvent(200, "eTIMS webhook received", body);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return Response.json({ error: "Webhook payload is too large" }, { status: 413 });
    logServerError("kra-etims-webhook", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}

async function recordEvent(
  statusCode: number,
  summary: string,
  payload?: unknown,
) {
  try {
    await prisma.platformWebhookEvent.create({
      data: {
        provider: "kra-etims",
        path: "/api/webhooks/kra-etims",
        statusCode,
        summary,
        payload:
          payload && typeof payload === "object"
            ? (payload as object)
            : undefined,
      },
    });
  } catch {
    // Optional debug table.
  }
}
