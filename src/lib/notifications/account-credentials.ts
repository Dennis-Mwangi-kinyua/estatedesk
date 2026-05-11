import "server-only";

import twilio from "twilio";

type SendAccountCredentialsInput = {
  fullName: string;
  username: string;
  password: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  loginUrl?: string;
};

function toE164(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");

  if (normalized.startsWith("+")) return normalized;
  if (normalized.startsWith("0")) return `+254${normalized.slice(1)}`;
  return `+${normalized}`;
}

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

async function sendWhatsapp(phone: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.warn("Skipping WhatsApp credentials delivery: missing Twilio env.");
    return;
  }

  const client = twilio(accountSid, authToken);

  await client.messages.create({
    from: `whatsapp:${from.startsWith("+") ? from : `+${from}`}`,
    to: `whatsapp:${toE164(phone)}`,
    body,
  });
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
    tasks.push(sendWhatsapp(input.phone, body));
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
