import twilio from "twilio";

type SendInviteWhatsappInput = {
  phone: string;
  inviteUrl: string;
  orgName: string;
  role: string;
};

function toE164(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");

  if (normalized.startsWith("+")) {
    return normalized;
  }

  if (normalized.startsWith("0")) {
    return `+254${normalized.slice(1)}`;
  }

  return `+${normalized}`;
}

export async function sendInviteWhatsapp({
  phone,
  inviteUrl,
  orgName,
  role,
}: SendInviteWhatsappInput) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error("Missing WhatsApp environment variables.");
  }

  const client = twilio(accountSid, authToken);

  const message = await client.messages.create({
    from: `whatsapp:${from.startsWith("+") ? from : `+${from}`}`,
    to: `whatsapp:${toE164(phone)}`,
    body: [
      `You have been invited to join ${orgName} on EstateDesk as ${role}.`,
      "",
      `Accept invite: ${inviteUrl}`,
    ].join("\n"),
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}