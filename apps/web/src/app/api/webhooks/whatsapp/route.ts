import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import {
  buildWhatsappBotReply,
  parseMetaWhatsappWebhook,
  type TenantBillingContext,
} from "@/lib/whatsapp/inbound-bot";
import { sendMetaWhatsappText, toWhatsappPhone } from "@/lib/whatsapp/meta";
import { getCurrentPeriod } from "@/lib/ledger-utils";
import { getPeriodBillForTenant } from "@/lib/billing/period-bill";

/**
 * Meta WhatsApp Cloud API webhook.
 * GET — subscription verification.
 * POST — inbound messages → billing chatbot intents.
 */

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return Response.json({ ok: false, error: "Verification failed" }, { status: 403 });
}

async function resolveTenantContext(
  waFrom: string,
): Promise<TenantBillingContext | null> {
  const digits = toWhatsappPhone(waFrom);
  const local = digits.startsWith("254") ? `0${digits.slice(3)}` : digits;
  const plus = digits.startsWith("254") ? `+${digits}` : `+${digits}`;

  const tenant = await prisma.tenant.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { phone: digits },
        { phone: local },
        { phone: plus },
        { phone: { endsWith: digits.slice(-9) } },
      ],
    },
    select: {
      id: true,
      orgId: true,
      fullName: true,
      phone: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!tenant) return null;

  const period = getCurrentPeriod();
  const bill = await getPeriodBillForTenant({
    db: prisma,
    orgId: tenant.orgId,
    tenantId: tenant.id,
    period,
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "https://estatedesk.co.ke";

  let serviceBalance = 0;
  let rentBalance = 0;
  let waterBalance = 0;
  if (bill) {
    for (const line of bill.lines) {
      if (line.kind === "RENT") rentBalance += line.balance;
      else if (line.kind === "WATER") waterBalance += line.balance;
      else serviceBalance += line.balance;
    }
  }

  const latestReceipt = await prisma.documentRecord.findFirst({
    where: {
      orgId: tenant.orgId,
      documentType: "RECEIPT",
      status: "ISSUED",
      entityType: "payment",
    },
    orderBy: { issuedAt: "desc" },
    select: { verificationCode: true, id: true, serialNumber: true },
  });

  const receiptPath = latestReceipt
    ? `/dashboard/tenant/receipts/${latestReceipt.id}`
    : null;

  return {
    tenantName: tenant.fullName,
    propertyName: bill?.propertyName ?? null,
    unitLabel: bill?.unitHouseNo ?? null,
    period: bill?.period ?? period,
    balanceKes: bill?.balance ?? 0,
    rentBalanceKes: rentBalance,
    waterBalanceKes: waterBalance,
    serviceBalanceKes: serviceBalance,
    portalUrl: `${appUrl}/dashboard/tenant`,
    latestReceiptUrl: receiptPath ? `${appUrl}${receiptPath}` : null,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = parseMetaWhatsappWebhook(body);

    if (messages.length === 0) {
      return Response.json({ ok: true, handled: 0 });
    }

    let handled = 0;
    for (const message of messages) {
      const context = await resolveTenantContext(message.from);
      const reply = buildWhatsappBotReply(message, context);

      try {
        await sendMetaWhatsappText({
          to: message.from,
          body: reply.body,
        });
        handled += 1;
      } catch (error) {
        logServerError("whatsapp-inbound-send", error);
        // Still acknowledge webhook so Meta does not retry forever when
        // outbound is misconfigured — log for ops.
      }

      try {
        await prisma.platformWebhookEvent.create({
          data: {
            provider: "whatsapp",
            path: "/api/webhooks/whatsapp",
            statusCode: 200,
            summary: `intent=${reply.intent} from=${message.from}`,
            payload: {
              intent: reply.intent,
              from: message.from,
              text: message.text.slice(0, 200),
            },
          },
        });
      } catch {
        // Optional debug table.
      }
    }

    return Response.json({ ok: true, handled });
  } catch (error) {
    logServerError("whatsapp-webhook", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
