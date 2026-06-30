import type { MpesaStkPushInput, MpesaStkPushResult } from "@/lib/mpesa/types";
import {
  IntegrationApprovalRequiredError,
  IntegrationMisconfiguredError,
  type IntegrationReadiness,
} from "./types";

export type TaxInvoiceInput = {
  orgId: string;
  taxpayerPin: string;
  invoiceNumber: string;
  currencyCode: string;
  amount: number;
  issuedAt: Date;
  lines: Array<{
    description: string;
    quantity: number;
    unitAmount: number;
    taxAmount?: number;
  }>;
};

export type TaxInvoiceResult = {
  providerReference: string;
  receiptNumber?: string;
  rawResponse?: unknown;
};

export type BankTransaction = {
  providerTransactionId: string;
  accountNumber: string;
  amount: number;
  currencyCode: string;
  paidAt: Date;
  reference?: string;
  payerName?: string;
};

export type TenantScreeningInput = {
  fullName: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  kraPin?: string;
  emiratesId?: string;
  consentAcceptedAt: Date;
};

export type TenantScreeningResult = {
  providerReference: string;
  riskBand: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  rawResponse?: unknown;
};

export interface PaymentRailProvider {
  requestCheckout(input: MpesaStkPushInput): Promise<MpesaStkPushResult>;
}

export interface TaxComplianceProvider {
  issueInvoice(input: TaxInvoiceInput): Promise<TaxInvoiceResult>;
}

export interface BankReconciliationProvider {
  fetchTransactions(since: Date): Promise<BankTransaction[]>;
}

export interface TenantScreeningProvider {
  screenTenant(input: TenantScreeningInput): Promise<TenantScreeningResult>;
}

export function assertIntegrationCanGoLive(readiness: IntegrationReadiness) {
  if (readiness.missingEnv.length > 0) {
    throw new IntegrationMisconfiguredError(readiness.name, readiness.missingEnv);
  }

  if (readiness.approvalRequired) {
    throw new IntegrationApprovalRequiredError(readiness.name, readiness.nextAction);
  }
}
