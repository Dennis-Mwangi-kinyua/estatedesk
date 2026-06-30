export type IntegrationRegion = "KE" | "EA" | "AE" | "GLOBAL";

export type IntegrationCategory =
  | "tax"
  | "payments"
  | "ledger"
  | "government"
  | "banking"
  | "screening"
  | "messaging"
  | "maintenance"
  | "leasing"
  | "pricing"
  | "investment"
  | "virtualTours";

export type IntegrationReadinessStatus =
  | "READY"
  | "PARTIAL"
  | "PENDING_APPROVAL"
  | "MISCONFIGURED"
  | "STUBBED"
  | "DISABLED";

export type IntegrationEnvRequirement = {
  key: string;
  label: string;
  requiredForLive: boolean;
};

export type IntegrationProviderDefinition = {
  id: string;
  name: string;
  category: IntegrationCategory;
  region: IntegrationRegion;
  phase: 1 | 2 | 3 | 4;
  approvalRequired: boolean;
  env: IntegrationEnvRequirement[];
  localFoundation: string;
  nextAction: string;
};

export type IntegrationReadiness = IntegrationProviderDefinition & {
  configuredEnv: string[];
  missingEnv: string[];
  status: IntegrationReadinessStatus;
};

export class IntegrationApprovalRequiredError extends Error {
  constructor(providerName: string, nextAction: string) {
    super(`${providerName} is structurally ready but pending approval: ${nextAction}`);
    this.name = "IntegrationApprovalRequiredError";
  }
}

export class IntegrationMisconfiguredError extends Error {
  constructor(providerName: string, missingEnv: string[]) {
    super(`${providerName} is missing required environment variables: ${missingEnv.join(", ")}`);
    this.name = "IntegrationMisconfiguredError";
  }
}
