import { integrationProviders } from "./providers";
import type {
  IntegrationProviderDefinition,
  IntegrationReadiness,
  IntegrationReadinessStatus,
} from "./types";

function readEnv(key: string) {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function getIntegrationReadiness(
  provider: IntegrationProviderDefinition,
): IntegrationReadiness {
  const requiredEnv = provider.env.filter((item) => item.requiredForLive);
  const configuredEnv = provider.env
    .filter((item) => Boolean(readEnv(item.key)))
    .map((item) => item.key);
  const missingEnv = requiredEnv
    .filter((item) => !readEnv(item.key))
    .map((item) => item.key);

  let status: IntegrationReadinessStatus;

  if (provider.approvalRequired) {
    status = missingEnv.length === 0 ? "PENDING_APPROVAL" : "MISCONFIGURED";
  } else if (missingEnv.length === 0) {
    status = "READY";
  } else if (configuredEnv.length > 0) {
    status = "PARTIAL";
  } else {
    status = "STUBBED";
  }

  return {
    ...provider,
    configuredEnv,
    missingEnv,
    status,
  };
}

export function getIntegrationReadinessReport() {
  const integrations = integrationProviders.map(getIntegrationReadiness);

  return {
    integrations,
    totals: {
      ready: integrations.filter((item) => item.status === "READY").length,
      partial: integrations.filter((item) => item.status === "PARTIAL").length,
      pendingApproval: integrations.filter((item) => item.status === "PENDING_APPROVAL").length,
      misconfigured: integrations.filter((item) => item.status === "MISCONFIGURED").length,
      stubbed: integrations.filter((item) => item.status === "STUBBED").length,
      disabled: integrations.filter((item) => item.status === "DISABLED").length,
    },
  };
}

export type IntegrationReadinessReport = ReturnType<
  typeof getIntegrationReadinessReport
>;
