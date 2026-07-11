/**
 * WhatsApp Business inbound chatbot intents (billing, balance, receipts).
 *
 * Pure message router — API route verifies Meta webhook then calls these
 * handlers. Full session state can be layered later; responses are text
 * templates ready for sendMetaWhatsappText.
 */

export type InboundWhatsappMessage = {
  from: string;
  text: string;
  messageId?: string;
  timestamp?: string;
};

export type BotReply = {
  body: string;
  /** Optional deep link the tenant can open in the PWA */
  actionUrl?: string;
  intent:
    | "balance"
    | "billing"
    | "receipt"
    | "pay"
    | "help"
    | "unknown"
    | "menu";
};

const MENU = [
  "EstateDesk assistant",
  "",
  "Reply with a number or keyword:",
  "1. BALANCE — outstanding rent & utilities",
  "2. BILL — this month's invoice summary",
  "3. PAY — how to pay via M-Pesa",
  "4. RECEIPT — latest verified receipt",
  "5. HELP — talk to your property office",
].join("\n");

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Detect tenant intent from free-text or menu number.
 */
export function detectWhatsappIntent(text: string): BotReply["intent"] {
  const t = normalize(text);
  if (!t || t === "hi" || t === "hello" || t === "menu" || t === "0" || t === "start") {
    return "menu";
  }
  if (t === "1" || /\bbalance\b|\bowing\b|\boustanding\b|\bdue\b/.test(t)) {
    return "balance";
  }
  if (t === "2" || /\bbill\b|\binvoice\b|\bcharges?\b/.test(t)) {
    return "billing";
  }
  if (t === "3" || /\bpay\b|\bmpesa\b|\bm-pesa\b|\bstk\b/.test(t)) {
    return "pay";
  }
  if (t === "4" || /\breceipt\b|\bpdf\b/.test(t)) {
    return "receipt";
  }
  if (t === "5" || /\bhelp\b|\bsupport\b|\bagent\b|\boffice\b/.test(t)) {
    return "help";
  }
  return "unknown";
}

export type TenantBillingContext = {
  tenantName?: string | null;
  propertyName?: string | null;
  unitLabel?: string | null;
  period?: string | null;
  balanceKes?: number | null;
  rentBalanceKes?: number | null;
  waterBalanceKes?: number | null;
  serviceBalanceKes?: number | null;
  paybill?: string | null;
  accountNumber?: string | null;
  latestReceiptUrl?: string | null;
  portalUrl?: string | null;
};

function money(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Build a chatbot reply. When context is missing, guide the user to the portal.
 */
export function buildWhatsappBotReply(
  message: InboundWhatsappMessage,
  context?: TenantBillingContext | null,
): BotReply {
  const intent = detectWhatsappIntent(message.text);
  const portal = context?.portalUrl || "/dashboard/tenant";

  if (intent === "menu") {
    return { intent: "menu", body: MENU, actionUrl: portal };
  }

  if (!context) {
    return {
      intent,
      body: [
        "We could not match this WhatsApp number to a tenant profile yet.",
        "Open the EstateDesk app to view your bill, or reply HELP for office support.",
        "",
        MENU,
      ].join("\n"),
      actionUrl: portal,
    };
  }

  const who = [
    context.tenantName,
    context.propertyName && context.unitLabel
      ? `${context.propertyName} / ${context.unitLabel}`
      : context.propertyName || context.unitLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  switch (intent) {
    case "balance":
      return {
        intent,
        body: [
          who ? `Hi ${who}` : "Hi",
          context.period ? `Period: ${context.period}` : null,
          `Total outstanding: ${money(context.balanceKes)}`,
          context.serviceBalanceKes != null
            ? `  Service / fees: ${money(context.serviceBalanceKes)}`
            : null,
          context.waterBalanceKes != null
            ? `  Water: ${money(context.waterBalanceKes)}`
            : null,
          context.rentBalanceKes != null
            ? `  Rent: ${money(context.rentBalanceKes)}`
            : null,
          "",
          "Utilities clear before rent on combined payments.",
          "Reply PAY for payment steps or BILL for a full summary.",
        ]
          .filter((line) => line != null)
          .join("\n"),
        actionUrl: portal,
      };

    case "billing":
      return {
        intent,
        body: [
          "Invoice summary",
          who || null,
          context.period ? `Period: ${context.period}` : null,
          `Amount due: ${money(context.balanceKes)}`,
          "",
          "Open your portal for the itemized PDF invoice.",
          portal,
        ]
          .filter((line) => line != null)
          .join("\n"),
        actionUrl: portal,
      };

    case "pay":
      return {
        intent,
        body: [
          "How to pay",
          context.paybill ? `Paybill: ${context.paybill}` : "Use M-Pesa STK from your EstateDesk invoice.",
          context.accountNumber
            ? `Account: ${context.accountNumber}`
            : "Account number is shown on your invoice.",
          `Amount: ${money(context.balanceKes)}`,
          "",
          "After paying, funds clear service/garbage/security/water before rent.",
          portal,
        ].join("\n"),
        actionUrl: portal,
      };

    case "receipt":
      return {
        intent,
        body: context.latestReceiptUrl
          ? [
              "Your latest verified receipt:",
              context.latestReceiptUrl,
              "",
              "You can also download receipts from the tenant portal.",
            ].join("\n")
          : [
              "No verified receipt is ready yet.",
              "Once a payment is verified, we can send the PDF here.",
              portal,
            ].join("\n"),
        actionUrl: context.latestReceiptUrl || portal,
      };

    case "help":
      return {
        intent,
        body: [
          "A property officer will follow up on this number during office hours.",
          "For urgent maintenance, report an issue in the EstateDesk app.",
          portal,
        ].join("\n"),
        actionUrl: portal,
      };

    default:
      return {
        intent: "unknown",
        body: ["Sorry, I did not get that.", "", MENU].join("\n"),
        actionUrl: portal,
      };
  }
}

/**
 * Parse Meta Cloud API webhook payload into inbound messages.
 */
export function parseMetaWhatsappWebhook(body: unknown): InboundWhatsappMessage[] {
  if (!body || typeof body !== "object") return [];
  const root = body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{
            from?: string;
            id?: string;
            timestamp?: string;
            type?: string;
            text?: { body?: string };
          }>;
        };
      }>;
    }>;
  };

  const out: InboundWhatsappMessage[] = [];
  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const msg of change.value?.messages ?? []) {
        if (msg.type && msg.type !== "text") continue;
        const text = msg.text?.body?.trim();
        if (!msg.from || !text) continue;
        out.push({
          from: msg.from,
          text,
          messageId: msg.id,
          timestamp: msg.timestamp,
        });
      }
    }
  }
  return out;
}
