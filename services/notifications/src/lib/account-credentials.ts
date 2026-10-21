import "server-only";

import { buildAccountCredentialsMessage } from "./account-credentials-message";
import {
  sendMetaWhatsappText,
} from "@/lib/whatsapp/meta";
import { sendTransactionalEmail } from "./email";

type SendAccountCredentialsInput = {
  fullName: string;
  username: string;
  setupUrl?: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  loginUrl?: string;
};

async function sendWhatsapp(phone: string, body: string) {
  if (
    !process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    !process.env.WHATSAPP_ACCESS_TOKEN?.trim()
  ) {
    console.warn("Skipping WhatsApp credentials delivery: missing Meta WhatsApp env.");
    return;
  }

  await sendMetaWhatsappText({ to: phone, body });
}

async function sendEmail(email: string, subject: string, body: string) {
  await sendTransactionalEmail(email, subject, body);
}

export async function sendAccountCredentials(input: SendAccountCredentialsInput) {
  const body = buildAccountCredentialsMessage({
    fullName: input.fullName,
    username: input.username,
    setupUrl: input.setupUrl,
    role: input.role,
    loginUrl: input.loginUrl,
  });
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
      console.error("Failed to send account access instructions.");
    }
  }
}
