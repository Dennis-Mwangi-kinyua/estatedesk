import {
  sendMetaWhatsappTemplate,
  sendMetaWhatsappText,
} from "@/lib/whatsapp/meta";

type SendInviteWhatsappInput = {
  phone: string;
  inviteUrl: string;
  orgName: string;
  role: string;
};

export async function sendInviteWhatsapp({
  phone,
  inviteUrl,
  orgName,
  role,
}: SendInviteWhatsappInput) {
  const templateName = process.env.WHATSAPP_INVITE_TEMPLATE_NAME?.trim();

  if (templateName) {
    return sendMetaWhatsappTemplate({
      to: phone,
      templateName,
      bodyParameters: [orgName, role, inviteUrl],
    });
  }

  return sendMetaWhatsappText({
    to: phone,
    body: [
      `You have been invited to join ${orgName} on EstateDesk as ${role}.`,
      "",
      `Accept invite: ${inviteUrl}`,
    ].join("\n"),
  });
}
