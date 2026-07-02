"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureAccountingFoundation, postJournalEntry } from "@/lib/accounting/engine";
import { postVerifiedPayment } from "@/lib/accounting/payments";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";

const PATH = "/dashboard/org/accounting";
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const amount = (form: FormData, key: string) => {
  const value = Number(text(form, key));
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${key} must be greater than zero.`);
  return value;
};

async function accountingSession() {
  return requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
}

export async function initializeAccountingAction() {
  const session = await accountingSession();
  await prisma.$transaction(async (tx) => {
    await ensureAccountingFoundation(tx, session.activeOrgId!);
    const verifiedPayments = await tx.payment.findMany({
      where: { orgId: session.activeOrgId!, verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] } },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    for (const payment of verifiedPayments) {
      await postVerifiedPayment(tx, payment.id, session.userId);
    }
  }, { timeout: 60_000 });
  revalidatePath(PATH);
  redirect(`${PATH}?message=Accounting ledger initialized and verified payments imported`);
}

export async function createVendorAction(formData: FormData) {
  const session = await accountingSession();
  const name = text(formData, "name");
  if (name.length < 2) throw new Error("Vendor name is required.");
  await prisma.accountingVendor.create({
    data: {
      orgId: session.activeOrgId!, name,
      contactPerson: text(formData, "contactPerson") || null,
      phone: text(formData, "phone") || null,
      email: text(formData, "email") || null,
      kraPin: text(formData, "kraPin") || null,
    },
  });
  revalidatePath(PATH);
}

export async function recordExpenseAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const vendorId = text(formData, "vendorId");
  const expenseAccountId = text(formData, "accountId");
  const description = text(formData, "description");
  const total = amount(formData, "amount");
  const date = new Date(text(formData, "date"));
  if (!vendorId || !expenseAccountId || description.length < 3 || Number.isNaN(date.getTime())) throw new Error("Complete the expense details.");
  await prisma.$transaction(async (tx) => {
    await ensureAccountingFoundation(tx, orgId);
    const organization = await tx.organization.findUniqueOrThrow({ where: { id: orgId }, select: { currencyCode: true } });
    const bill = await tx.accountingVendorBill.create({
      data: {
        orgId, vendorId, billNumber: text(formData, "billNumber") || `EXP-${Date.now()}`,
        billDate: date, dueDate: date, status: "PAID", currencyCode: organization.currencyCode,
        subtotal: total, total, amountPaid: total, notes: text(formData, "notes") || null,
        createdByUserId: session.userId, approvedByUserId: session.userId, approvedAt: new Date(),
        lines: { create: { accountId: expenseAccountId, description, unitPrice: total, total } },
      },
    });
    const journal = await postJournalEntry({
      db: tx, orgId, entryDate: date, description, sourceType: "VENDOR_BILL", sourceId: bill.id, userId: session.userId,
      lines: [{ accountId: expenseAccountId, debit: total }, { systemKey: "BANK", credit: total }],
    });
    await tx.accountingVendorBill.update({ where: { id: bill.id }, data: { journalEntryId: journal.id } });
  });
  revalidatePath(PATH);
}

export async function createManualJournalAction(formData: FormData) {
  const session = await accountingSession();
  const debitAccountId = text(formData, "debitAccountId");
  const creditAccountId = text(formData, "creditAccountId");
  const description = text(formData, "description");
  const value = amount(formData, "amount");
  const date = new Date(text(formData, "date"));
  if (!debitAccountId || !creditAccountId || debitAccountId === creditAccountId || description.length < 3 || Number.isNaN(date.getTime())) throw new Error("Complete a valid balanced journal.");
  await postJournalEntry({
    db: prisma, orgId: session.activeOrgId!, entryDate: date, description, memo: text(formData, "memo") || null,
    sourceType: "MANUAL", userId: session.userId,
    lines: [{ accountId: debitAccountId, debit: value }, { accountId: creditAccountId, credit: value }],
  });
  revalidatePath(PATH);
}
