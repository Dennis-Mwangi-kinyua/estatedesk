export type StartPaymentInput = {
  source: string;
  id: string;
  method: string;
  phoneNumber?: string;
  accountName?: string;
  transactionId?: string;
  amount?: number;
  months?: number;
};

export type TenantPaymentCheckoutSummary = {
  friendlyReference: string;
  description: string;
  propertyName: string;
  unitLabel: string;
  amount: number | null;
};