import type { MpesaStkPushInput, MpesaStkPushResult } from "./types";
import { getMpesaConfigForOrg, type MpesaConfig } from "./config";

export function normalizeMpesaPhone(phone: string) {
  const cleaned = phone.replace(/\D+/g, "");
  if (/^254[17]\d{8}$/.test(cleaned)) return cleaned;
  if (/^0[17]\d{8}$/.test(cleaned)) return `254${cleaned.slice(1)}`;
  if (/^[17]\d{8}$/.test(cleaned)) return `254${cleaned}`;
  throw new Error("Enter a valid Kenyan M-Pesa phone number.");
}

function darajaBaseUrl(config: MpesaConfig) {
  return config.environment === "production"
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

async function getAccessToken(config: MpesaConfig) {
  const credentials = Buffer.from(
    `${config.consumerKey}:${config.consumerSecret}`,
  ).toString("base64");
  const payload = await darajaFetch(
    `${darajaBaseUrl(config)}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } },
  );
  if (typeof payload.access_token !== "string") {
    throw new Error("Daraja did not return an access token.");
  }
  return payload.access_token;
}

export async function requestMpesaStkPush(
  input: MpesaStkPushInput & { orgId: string },
): Promise<MpesaStkPushResult> {
  const config = getMpesaConfigForOrg(input.orgId);
  if (!config) {
    throw new Error("M-Pesa is not configured for this organisation.");
  }
  if (!Number.isFinite(input.amount) || input.amount < 1 || !Number.isInteger(input.amount)) {
    throw new Error("M-Pesa amount must be a whole number of shillings, at least KES 1.");
  }

  const shortcode = config.shortcode;
  const timestamp = darajaTimestamp();
  const password = Buffer.from(
    `${shortcode}${config.passkey}${timestamp}`,
  ).toString("base64");
  const phone = normalizeMpesaPhone(input.phone);
  const token = await getAccessToken(config);
  const payload = await darajaFetch(
    `${darajaBaseUrl(config)}/mpesa/stkpush/v1/processrequest`,
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
        CallBackURL: config.callbackUrl,
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
