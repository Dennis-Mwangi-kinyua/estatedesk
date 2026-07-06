import type { PaymentMethod, Prisma } from "@prisma/client";

export type PaymentHandlerContext = {
  tx: Prisma.TransactionClient;
  orgId: string;
  userId: string;
  tenant: {
    id: string;
    fullName: string;
  };
  paymentMethod: PaymentMethod;
  paidAt: Date;
  transactionId: string;
  transactionReferenceKey: string | null;
  phoneNumber?: string;
  accountName?: string;
  source: string;
  sourceId: string;
};