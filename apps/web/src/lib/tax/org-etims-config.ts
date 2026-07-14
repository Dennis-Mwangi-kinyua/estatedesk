/**
 * Resolve eTIMS client config for an organization:
 * org KraIntegration secrets (encrypted) override platform env defaults.
 */

import "server-only";

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto/secrets";
import {
  getEtimsClientConfig,
  type EtimsClientConfig,
  type EtimsEnvironment,
} from "@/lib/tax/etims-client";

export async function getEtimsClientConfigForOrg(
  orgId: string,
): Promise<EtimsClientConfig & { source: "org" | "platform" | "none" }> {
  const platform = getEtimsClientConfig();

  const row = await prisma.kraIntegration.findUnique({
    where: { orgId },
    select: {
      environment: true,
      clientId: true,
      clientSecretCiphertext: true,
      apiBaseUrl: true,
      webhookSecretCiphertext: true,
      controlUnitSerial: true,
      branchOfficeId: true,
      status: true,
    },
  });

  if (!row || row.status === "DISABLED") {
    return {
      ...platform,
      source: platform.configured ? "platform" : "none",
    };
  }

  const clientSecret = decryptSecret(row.clientSecretCiphertext);
  const webhookSecret = decryptSecret(row.webhookSecretCiphertext);
  const clientId = row.clientId?.trim() || platform.clientId;
  const secret = clientSecret || platform.clientSecret;

  let environment: EtimsEnvironment = "unconfigured";
  if (row.environment === "PRODUCTION") environment = "production";
  else if (row.environment === "SANDBOX") environment = "sandbox";
  else if (clientId && secret) environment = "sandbox";

  const baseUrl =
    row.apiBaseUrl?.trim() ||
    platform.baseUrl ||
    (environment === "production"
      ? "https://etims-api.kra.go.ke"
      : "https://etims-api-sbx.kra.go.ke");

  const controlUnitSerial =
    row.controlUnitSerial?.trim() || platform.controlUnitSerial;

  const configured = Boolean(
    clientId && secret && environment !== "unconfigured",
  );

  return {
    environment: configured ? environment : "unconfigured",
    baseUrl: configured ? baseUrl : null,
    clientId: clientId ?? null,
    clientSecret: secret ?? null,
    webhookSecret: webhookSecret || platform.webhookSecret,
    controlUnitSerial: controlUnitSerial ?? null,
    branchOfficeId: row.branchOfficeId?.trim() || platform.branchOfficeId,
    configured,
    source: configured
      ? clientSecret || row.clientId
        ? "org"
        : platform.configured
          ? "platform"
          : "none"
      : platform.configured
        ? "platform"
        : "none",
  };
}
