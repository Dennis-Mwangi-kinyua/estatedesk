import "server-only";

import {
  sendMetaWhatsappTemplate,
  sendMetaWhatsappText,
} from "@/lib/whatsapp/meta";

type SendAccountCredentialsInput = {
  fullName: string;
  username: string;
  password: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  loginUrl?: string;
};

function buildMessage(input: SendAccountCredentialsInput) {
  return [
    `Hello ${input.fullName}, your EstateDesk ${input.role} account has been created.`,
    "",
    `Username: ${input.username}`,
    `Temporary password: ${input.password}`,
    input.loginUrl ? `Login: ${input.loginUrl}` : null,
    "",
    "For your security, you will be asked to change this password the first time you sign in.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendWhatsapp(phone: string, body: string, input: SendAccountCredentialsInput) {
  if (
    !process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    !process.env.WHATSAPP_ACCESS_TOKEN?.trim()
  ) {
    console.warn("Skipping WhatsApp credentials delivery: missing Meta WhatsApp env.");
    return;
  }

  const templateName = process.env.WHATSAPP_CREDENTIALS_TEMPLATE_NAME?.trim();

  if (templateName) {
    await sendMetaWhatsappTemplate({
      to: phone,
      templateName,
      bodyParameters: [
        input.fullName,
        input.role,
        input.username,
        input.password,
        input.loginUrl ?? "",
      ],
    });
    return;
  }

  await sendMetaWhatsappText({ to: phone, body });
}

async function sendEmail(email: string, subject: string, body: string) {
  // Replace this with Resend, SendGrid, SES, or your preferred provider.
  if (process.env.NODE_ENV !== "production") {
    console.log("sendAccountCredentialsEmail", {
      to: email,
      subject,
      body: body.replace(/Temporary password: .+/g, "Temporary password: [redacted]"),
    });
  }
}

export async function sendAccountCredentials(input: SendAccountCredentialsInput) {
  const body = buildMessage(input);
  const subject = `Your EstateDesk ${input.role} account`;

  const tasks: Promise<void>[] = [];

  if (input.phone) {
    tasks.push(sendWhatsapp(input.phone, body, input));
  }

  if (input.email) {
    tasks.push(sendEmail(input.email, subject, body));
  }

  const results = await Promise.allSettled(tasks);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to send account credentials:", result.reason);
    }
  }
}
