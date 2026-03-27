import type { MpesaStkPushInput, MpesaStkPushResult } from "./types";

function normalizePhone(phone: string) {
  const cleaned = phone.replace(/\s+/g, "").replace(/^\+/, "");

  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;

  return cleaned;
}

export async function requestMpesaStkPush(
  input: MpesaStkPushInput
): Promise<MpesaStkPushResult> {
  /**
   * Replace this with real Safaricom Daraja integration.
   * This stub keeps your app structure clean first.
   */
  return {
    merchantRequestId: `mock-${Date.now()}`,
    checkoutRequestId: `ws_CO_${Date.now()}`,
    responseCode: "0",
    responseDescription: "Success. Request accepted for processing",
    customerMessage: `STK push initiated for ${normalizePhone(input.phone)}`,
  };
}