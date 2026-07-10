import "server-only";

import type { AccountingRequest, Prisma } from "@prisma/client";
import { ensureAccountingFoundation, postJournalEntry } from "@/lib/accounting/engine";

type WorkflowDb = Prisma.TransactionClient;

export async function postAccountingRequestToPayables(
  db: WorkflowDb,
  input: {
    orgId: string;
    userId: string;
    request: Pick<
      AccountingRequest,
      | "id"
      | "requestNumber"
      | "title"
      | "description"
      | "amount"
      | "propertyId"
      | "vendorName"
      | "payeeName"
      | "attachmentKey"
      | "reference"
    >;
    expenseAccountId: string;
    payeeLabel?: string | null;
  },
) {
  await ensureAccountingFoundation(db, input.orgId);

  const vendorName =
    input.request.vendorName?.trim() ||
    input.request.payeeName?.trim() ||
    input.payeeLabel?.trim() ||
    "Finance request payee";

  let vendor = await db.accountingVendor.findFirst({
    where: {
      orgId: input.orgId,
      isActive: true,
      name: { equals: vendorName, mode: "insensitive" },
    },
  });

  if (!vendor) {
    vendor = await db.accountingVendor.create({
      data: { orgId: input.orgId, name: vendorName },
    });
  }

  const organization = await db.organization.findUniqueOrThrow({
    where: { id: input.orgId },
    select: { currencyCode: true },
  });

  const billDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const total = Number(input.request.amount);
  const lineDescription = input.request.title;
  const bill = await db.accountingVendorBill.create({
    data: {
      orgId: input.orgId,
      vendorId: vendor.id,
      propertyId: input.request.propertyId,
      billNumber: input.request.requestNumber,
      billDate,
      dueDate,
      status: "APPROVED",
      currencyCode: organization.currencyCode,
      subtotal: total,
      total,
      amountPaid: 0,
      notes: [
        `From finance request ${input.request.requestNumber}`,
        input.request.reference ? `Ref: ${input.request.reference}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      attachmentKey: input.request.attachmentKey,
      createdByUserId: input.userId,
      approvedByUserId: input.userId,
      approvedAt: new Date(),
      lines: {
        create: {
          accountId: input.expenseAccountId,
          description: lineDescription,
          propertyId: input.request.propertyId,
          unitPrice: total,
          total,
        },
      },
    },
  });

  const journal = await postJournalEntry({
    db,
    orgId: input.orgId,
    entryDate: billDate,
    description: `Vendor bill: ${input.request.title}`,
    sourceType: "VENDOR_BILL",
    sourceId: bill.id,
    userId: input.userId,
    lines: [
      {
        accountId: input.expenseAccountId,
        debit: total,
        propertyId: input.request.propertyId,
        vendorId: vendor.id,
      },
      {
        systemKey: "ACCOUNTS_PAYABLE",
        credit: total,
        propertyId: input.request.propertyId,
        vendorId: vendor.id,
      },
    ],
  });

  await db.accountingVendorBill.update({
    where: { id: bill.id },
    data: { journalEntryId: journal.id },
  });

  return bill.id;
}