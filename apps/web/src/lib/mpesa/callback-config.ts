import { timingSafeEqual } from "node:crypto";
import { getMpesaConfigs, getMpesaConfigForOrg } from "@/lib/mpesa/config";

export function getMpesaConfigForCallback(secret: string | null) {
  if (!secret) return undefined;
  const secretBytes = Buffer.from(secret);
  const matches = getMpesaConfigs().filter((config) => {
    const expectedBytes = Buffer.from(config.callbackSecret);
    return expectedBytes.length === secretBytes.length && timingSafeEqual(expectedBytes, secretBytes);
  });
  return matches.length === 1 ? getMpesaConfigForOrg(matches[0].orgId) : undefined;
}
