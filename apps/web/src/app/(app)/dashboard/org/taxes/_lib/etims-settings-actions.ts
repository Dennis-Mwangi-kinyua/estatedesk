"use server";

import { revalidatePath } from "next/cache";
import { KraEnvironment, KraFilingMode, IntegrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { encryptSecret, isEncryptedSecret } from "@/lib/crypto/secrets";

const TAXES_PATH = "/dashboard/org/taxes";

function parseEnv(value: string): KraEnvironment {
  const v = value.trim().toUpperCase();
  if (v === "PRODUCTION") return "PRODUCTION";
  return "SANDBOX";
}

function parseMode(value: string): KraFilingMode {
  const v = value.trim().toUpperCase();
  if (v === "API") return "API";
  if (v === "ERITS_MANUAL") return "ERITS_MANUAL";
  return "HYBRID";
}

function parseStatus(value: string): IntegrationStatus {
  const v = value.trim().toUpperCase();
  if (v === "DISABLED") return "DISABLED";
  if (v === "ERROR") return "ERROR";
  return "ACTIVE";
}

export async function saveOrgEtimsSettingsAction(formData: FormData) {
  const session = await requireOrgRole(["ADMIN", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;

  const environment = parseEnv(String(formData.get("environment") ?? "SANDBOX"));
  const filingMode = parseMode(String(formData.get("filingMode") ?? "HYBRID"));
  const status = parseStatus(String(formData.get("status") ?? "ACTIVE"));
  const clientId = String(formData.get("clientId") ?? "").trim() || null;
  const clientSecretRaw = String(formData.get("clientSecret") ?? "").trim();
  const webhookSecretRaw = String(formData.get("webhookSecret") ?? "").trim();
  const apiBaseUrl = String(formData.get("apiBaseUrl") ?? "").trim() || null;
  const eritsBaseUrl = String(formData.get("eritsBaseUrl") ?? "").trim() || null;
  const controlUnitSerial =
    String(formData.get("controlUnitSerial") ?? "").trim() || null;
  const branchOfficeId =
    String(formData.get("branchOfficeId") ?? "").trim() || null;

  const existing = await prisma.kraIntegration.findUnique({
    where: { orgId },
    select: {
      clientSecretCiphertext: true,
      webhookSecretCiphertext: true,
    },
  });

  // Keep previous ciphertext if the form sent blank or a mask placeholder
  let clientSecretCiphertext = existing?.clientSecretCiphertext ?? null;
  if (clientSecretRaw && !clientSecretRaw.includes("•")) {
    clientSecretCiphertext = encryptSecret(clientSecretRaw);
  } else if (clientSecretRaw && isEncryptedSecret(clientSecretRaw)) {
    clientSecretCiphertext = clientSecretRaw;
  }

  let webhookSecretCiphertext = existing?.webhookSecretCiphertext ?? null;
  if (webhookSecretRaw && !webhookSecretRaw.includes("•")) {
    webhookSecretCiphertext = encryptSecret(webhookSecretRaw);
  }

  await prisma.kraIntegration.upsert({
    where: { orgId },
    create: {
      orgId,
      environment,
      filingMode,
      status,
      clientId,
      clientSecretCiphertext,
      webhookSecretCiphertext,
      apiBaseUrl,
      eritsBaseUrl,
      controlUnitSerial,
      branchOfficeId,
      lastError: null,
    },
    update: {
      environment,
      filingMode,
      status,
      clientId,
      clientSecretCiphertext,
      webhookSecretCiphertext,
      apiBaseUrl,
      eritsBaseUrl,
      controlUnitSerial,
      branchOfficeId,
      lastError: null,
    },
  });

  revalidatePath(TAXES_PATH);
}
