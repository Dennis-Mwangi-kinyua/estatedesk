import type { PaymentMethod, Prisma } from "@prisma/client";
import type { PaymentSettlementMode } from "@/lib/payments/methods-catalog";

export type PaymentHandlerContext = {
  tx: Prisma.TransactionClient;
  orgId: string;
  userId: string;
  tenant: {
    id: string;
    fullName: string;
  };
  paymentMethod: PaymentMethod;
  /** Checkout method id (e.g. mpesa-stk, manual-mpesa, kcb). */
  checkoutMethod: string;
  /** gateway = auto-settle on success; manual = pending org verification. */
  settlementMode: PaymentSettlementMode;
  paidAt: Date;
  transactionId: string;
  transactionReferenceKey: string | null;
  phoneNumber?: string;
  accountName?: string;
  source: string;
  sourceId: string;
  proofMessage?: string;
  /** Populated for STK after Daraja responds. */
  checkoutRequestId?: string | null;
  merchantRequestId?: string | null;
};