import type { MpesaStkPushInput, MpesaStkPushResult } from "./types";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`M-Pesa Daraja is missing ${name}.`);
  return value;
}

export function normalizeMpesaPhone(phone: string) {
  const cleaned = phone.replace(/\D+/g, "");
  if (/^254[17]\d{8}$/.test(cleaned)) return cleaned;
  if (/^0[17]\d{8}$/.test(cleaned)) return `254${cleaned.slice(1)}`;
  if (/^[17]\d{8}$/.test(cleaned)) return `254${cleaned}`;
  throw new Error("Enter a valid Kenyan M-Pesa phone number.");
}

function darajaBaseUrl() {
  return process.env.MPESA_ENVIRONMENT === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

function darajaTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}${part("month")}${part("day")}${part("hour")}${part("minute")}${part("second")}`;
}

async function darajaFetch(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      typeof payload.errorMessage === "string"
        ? payload.errorMessage
        : `Daraja request failed with HTTP ${response.status}.`,
    );
  }
  return payload;
}

async function getAccessToken() {
  const credentials = Buffer.from(
    `${required("MPESA_CONSUMER_KEY")}:${required("MPESA_CONSUMER_SECRET")}`,
  ).toString("base64");
  const payload = await darajaFetch(
    `${darajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } },
  );
  if (typeof payload.access_token !== "string") {
    throw new Error("Daraja did not return an access token.");
  }
  return payload.access_token;
}

export async function requestMpesaStkPush(
  input: MpesaStkPushInput,
): Promise<MpesaStkPushResult> {
  if (!Number.isFinite(input.amount) || input.amount < 1) {
    throw new Error("M-Pesa amount must be at least KES 1.");
  }

  const shortcode = required("MPESA_SHORTCODE");
  const timestamp = darajaTimestamp();
  const password = Buffer.from(
    `${shortcode}${required("MPESA_PASSKEY")}${timestamp}`,
  ).toString("base64");
  const phone = normalizeMpesaPhone(input.phone);
  const token = await getAccessToken();
  const payload = await darajaFetch(
    `${darajaBaseUrl()}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(input.amount),
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: required("MPESA_CALLBACK_URL"),
        AccountReference: input.accountReference.slice(0, 12),
        TransactionDesc: input.transactionDesc.slice(0, 13),
      }),
    },
  );

  return {
    merchantRequestId: String(payload.MerchantRequestID ?? ""),
    checkoutRequestId: String(payload.CheckoutRequestID ?? ""),
    responseCode: String(payload.ResponseCode ?? ""),
    responseDescription: String(payload.ResponseDescription ?? ""),
    customerMessage: String(payload.CustomerMessage ?? ""),
  };
}
