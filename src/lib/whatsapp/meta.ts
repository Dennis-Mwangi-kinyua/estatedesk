import "server-only";

type SendMetaWhatsappTextInput = {
  to: string;
  body: string;
};

type SendMetaWhatsappTemplateInput = {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters: string[];
};

type MetaWhatsappResponse = {
  messaging_product?: string;
  contacts?: Array<{
    input?: string;
    wa_id?: string;
  }>;
  messages?: Array<{
    id?: string;
    message_status?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

export function toWhatsappPhone(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");

  if (normalized.startsWith("+")) {
    return normalized.slice(1);
  }

  if (normalized.startsWith("0")) {
    return `254${normalized.slice(1)}`;
  }

  return normalized;
}

function getMetaWhatsappConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v20.0";

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      "Missing Meta WhatsApp environment variables: WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.",
    );
  }

  return {
    accessToken,
    endpoint: `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
  };
}

export async function sendMetaWhatsappText({
  to,
  body,
}: SendMetaWhatsappTextInput) {
  const config = getMetaWhatsappConfig();

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toWhatsappPhone(to),
      type: "text",
      text: {
        preview_url: true,
        body,
      },
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as MetaWhatsappResponse;

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error?.message ??
        `Meta WhatsApp request failed with status ${response.status}.`,
    );
  }

  return {
    provider: "meta-whatsapp",
    messageId: payload.messages?.[0]?.id ?? null,
    status: payload.messages?.[0]?.message_status ?? "accepted",
    waId: payload.contacts?.[0]?.wa_id ?? null,
  };
}

export async function sendMetaWhatsappTemplate({
  to,
  templateName,
  languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en",
  bodyParameters,
}: SendMetaWhatsappTemplateInput) {
  const config = getMetaWhatsappConfig();

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toWhatsappPhone(to),
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components:
          bodyParameters.length > 0
            ? [
                {
                  type: "body",
                  parameters: bodyParameters.map((text) => ({
                    type: "text",
                    text,
                  })),
                },
              ]
            : undefined,
      },
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as MetaWhatsappResponse;

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error?.message ??
        `Meta WhatsApp template request failed with status ${response.status}.`,
    );
  }

  return {
    provider: "meta-whatsapp",
    templateName,
    messageId: payload.messages?.[0]?.id ?? null,
    status: payload.messages?.[0]?.message_status ?? "accepted",
    waId: payload.contacts?.[0]?.wa_id ?? null,
  };
}
