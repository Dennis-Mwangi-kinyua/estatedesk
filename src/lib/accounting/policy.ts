import type { AccountingRecognitionMode } from "@prisma/client";

export type AccountingPolicy = {
  recognitionMode: AccountingRecognitionMode;
  fiscalYearStartMonth: number;
  autoPostPayments: boolean;
  autoPostBilling: boolean;
  ownerStatementEmailEnabled: boolean;
  ownerStatementEmailDayOfMonth: number;
  ownerStatementLastSentAt: Date | null;
  initializedAt: Date | null;
};

export const DEFAULT_ACCOUNTING_POLICY: AccountingPolicy = {
  recognitionMode: "ACCRUAL",
  fiscalYearStartMonth: 1,
  autoPostPayments: true,
  autoPostBilling: true,
  ownerStatementEmailEnabled: false,
  ownerStatementEmailDayOfMonth: 5,
  ownerStatementLastSentAt: null,
  initializedAt: null,
};

export function usesAccrualRecognition(settings: Pick<AccountingPolicy, "recognitionMode">) {
  return settings.recognitionMode === "ACCRUAL";
}