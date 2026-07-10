"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postRentChargeAccrual, postWaterBillAccrual } from "@/lib/accounting/billing";
import { ensureAccountingFoundation, postJournalEntry } from "@/lib/accounting/engine";
import { postVerifiedPayment } from "@/lib/accounting/payments";
import { ensureAccountingSettings } from "@/lib/accounting/settings";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";

const PATH = "/dashboard/org/accounting";
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const amount = (form: FormData, key: string) => {
  const value = Number(text(form, key));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} must be greater than zero.`);
  }
  return value;
};

function cashSystemKey(method: string) {
  if (method === "MPESA") return "MPESA";
  if (method === "CASH") return "CASH";
  return "BANK";
}

async function accountingSession() {
  return requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
}

export async function updateAccountingSettingsAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const recognitionMode = text(formData, "recognitionMode");
  const fiscalYearStartMonth = Number(text(formData, "fiscalYearStartMonth"));
  const autoPostPayments = formData.get("autoPostPayments") === "on";
  const autoPostBilling = formData.get("autoPostBilling") === "on";
  const ownerStatementEmailEnabled = formData.get("ownerStatementEmailEnabled") === "on";
  const ownerStatementEmailDayOfMonth = Number(text(formData, "ownerStatementEmailDayOfMonth"));

  if (!["CASH", "ACCRUAL"].includes(recognitionMode)) {
    throw new Error("Recognition mode must be cash or accrual.");
  }

  if (!Number.isInteger(fiscalYearStartMonth) || fiscalYearStartMonth < 1 || fiscalYearStartMonth > 12) {
    throw new Error("Fiscal year start month must be between 1 and 12.");
  }

  if (
    !Number.isInteger(ownerStatementEmailDayOfMonth) ||
    ownerStatementEmailDayOfMonth < 1 ||
    ownerStatementEmailDayOfMonth > 28
  ) {
    throw new Error("Owner statement send day must be between 1 and 28.");
  }

  await ensureAccountingSettings(prisma, orgId, {
    recognitionMode: recognitionMode as "CASH" | "ACCRUAL",
    fiscalYearStartMonth,
    autoPostPayments,
    autoPostBilling,
    ownerStatementEmailEnabled,
    ownerStatementEmailDayOfMonth,
  });

  revalidatePath(PATH);
  revalidatePath(`${PATH}/settings`);
  redirect(`${PATH}/settings?message=Accounting settings saved`);
}

export async function syncAccrualsAction() {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;

  await prisma.$transaction(
    async (tx) => {
      await ensureAccountingFoundation(tx, orgId);

      const [rentCharges, waterBills] = await Promise.all([
        tx.rentCharge.findMany({
          where: { orgId, journalEntryId: null, balance: { gt: 0 } },
          select: { id: true },
          orderBy: { createdAt: "asc" },
        }),
        tx.waterBill.findMany({
          where: {
            orgId,
            journalEntryId: null,
            status: { in: ["ISSUED", "PAYMENT_PENDING", "DISPUTED"] },
          },
          select: { id: true },
          orderBy: { createdAt: "asc" },
        }),
      ]);

      for (const charge of rentCharges) {
        await postRentChargeAccrual(tx, charge.id, session.userId);
      }

      for (const bill of waterBills) {
        await postWaterBillAccrual(tx, bill.id, session.userId);
      }
    },
    { timeout: 120_000 },
  );

  revalidatePath(PATH);
  revalidatePath(`${PATH}/receivables`);
  redirect(`${PATH}?message=Outstanding billing accruals synced to the ledger`);
}

export async function initializeAccountingAction() {
  const session = await accountingSession();
  await prisma.$transaction(
    async (tx) => {
      await ensureAccountingFoundation(tx, session.activeOrgId!);
      const verifiedPayments = await tx.payment.findMany({
        where: {
          orgId: session.activeOrgId!,
          verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] },
        },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      for (const payment of verifiedPayments) {
        await postVerifiedPayment(tx, payment.id, session.userId);
      }

      const [rentCharges, waterBills] = await Promise.all([
        tx.rentCharge.findMany({
          where: { orgId: session.activeOrgId!, journalEntryId: null, balance: { gt: 0 } },
          select: { id: true },
        }),
        tx.waterBill.findMany({
          where: {
            orgId: session.activeOrgId!,
            journalEntryId: null,
            status: { in: ["ISSUED", "PAYMENT_PENDING", "DISPUTED"] },
          },
          select: { id: true },
        }),
      ]);

      for (const charge of rentCharges) {
        await postRentChargeAccrual(tx, charge.id, session.userId);
      }

      for (const bill of waterBills) {
        await postWaterBillAccrual(tx, bill.id, session.userId);
      }
    },
    { timeout: 120_000 },
  );
  revalidatePath(PATH);
  redirect(`${PATH}?message=Accounting ledger initialized and verified payments imported`);
}

export async function syncPaymentsAction() {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;

  const [verifiedPayments, postedJournals] = await Promise.all([
    prisma.payment.findMany({
      where: {
        orgId,
        verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] },
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.accountingJournalEntry.findMany({
      where: { orgId, sourceType: "PAYMENT", sourceId: { not: null } },
      select: { sourceId: true },
    }),
  ]);

  const postedIds = new Set(
    postedJournals
      .map((entry) => entry.sourceId)
      .filter((id): id is string => Boolean(id)),
  );
  const pending = verifiedPayments.filter((payment) => !postedIds.has(payment.id));

  if (pending.length === 0) {
    redirect(`${PATH}?message=All verified payments are already posted to the ledger`);
  }

  await prisma.$transaction(
    async (tx) => {
      await ensureAccountingFoundation(tx, orgId);
      for (const payment of pending) {
        await postVerifiedPayment(tx, payment.id, session.userId);
      }
    },
    { timeout: 60_000 },
  );

  revalidatePath(PATH);
  redirect(
    `${PATH}?message=Posted ${pending.length} verified payment${pending.length === 1 ? "" : "s"} to the ledger`,
  );
}

export async function createVendorAction(formData: FormData) {
  const session = await accountingSession();
  const name = text(formData, "name");
  if (name.length < 2) throw new Error("Vendor name is required.");
  await prisma.accountingVendor.create({
    data: {
      orgId: session.activeOrgId!,
      name,
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
  const propertyId = text(formData, "propertyId") || null;
  const paymentMethod = text(formData, "paymentMethod") || "BANK";

  if (
    !vendorId ||
    !expenseAccountId ||
    description.length < 3 ||
    Number.isNaN(date.getTime())
  ) {
    throw new Error("Complete the expense details.");
  }

  await prisma.$transaction(async (tx) => {
    await ensureAccountingFoundation(tx, orgId);
    const organization = await tx.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true },
    });
    const bill = await tx.accountingVendorBill.create({
      data: {
        orgId,
        vendorId,
        propertyId,
        billNumber: text(formData, "billNumber") || `EXP-${Date.now()}`,
        billDate: date,
        dueDate: date,
        status: "PAID",
        currencyCode: organization.currencyCode,
        subtotal: total,
        total,
        amountPaid: total,
        notes: text(formData, "notes") || null,
        createdByUserId: session.userId,
        approvedByUserId: session.userId,
        approvedAt: new Date(),
        lines: {
          create: {
            accountId: expenseAccountId,
            description,
            propertyId,
            unitPrice: total,
            total,
          },
        },
      },
    });
    const journal = await postJournalEntry({
      db: tx,
      orgId,
      entryDate: date,
      description,
      sourceType: "VENDOR_BILL",
      sourceId: bill.id,
      userId: session.userId,
      lines: [
        {
          accountId: expenseAccountId,
          debit: total,
          propertyId,
          vendorId,
        },
        {
          systemKey: cashSystemKey(paymentMethod),
          credit: total,
          propertyId,
          vendorId,
        },
      ],
    });
    await tx.accountingVendorBill.update({
      where: { id: bill.id },
      data: { journalEntryId: journal.id },
    });
  });
  revalidatePath(PATH);
}

export async function recordVendorBillAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const vendorId = text(formData, "vendorId");
  const expenseAccountId = text(formData, "accountId");
  const description = text(formData, "description");
  const total = amount(formData, "amount");
  const billDate = new Date(text(formData, "billDate"));
  const dueDate = new Date(text(formData, "dueDate") || text(formData, "billDate"));
  const propertyId = text(formData, "propertyId") || null;

  if (
    !vendorId ||
    !expenseAccountId ||
    description.length < 3 ||
    Number.isNaN(billDate.getTime()) ||
    Number.isNaN(dueDate.getTime())
  ) {
    throw new Error("Complete the vendor bill details.");
  }

  await prisma.$transaction(async (tx) => {
    await ensureAccountingFoundation(tx, orgId);
    const organization = await tx.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true },
    });
    const bill = await tx.accountingVendorBill.create({
      data: {
        orgId,
        vendorId,
        propertyId,
        billNumber: text(formData, "billNumber") || `BILL-${Date.now()}`,
        billDate,
        dueDate,
        status: "APPROVED",
        currencyCode: organization.currencyCode,
        subtotal: total,
        total,
        amountPaid: 0,
        notes: text(formData, "notes") || null,
        createdByUserId: session.userId,
        approvedByUserId: session.userId,
        approvedAt: new Date(),
        lines: {
          create: {
            accountId: expenseAccountId,
            description,
            propertyId,
            unitPrice: total,
            total,
          },
        },
      },
    });
    const journal = await postJournalEntry({
      db: tx,
      orgId,
      entryDate: billDate,
      description: `Vendor bill: ${description}`,
      sourceType: "VENDOR_BILL",
      sourceId: bill.id,
      userId: session.userId,
      lines: [
        {
          accountId: expenseAccountId,
          debit: total,
          propertyId,
          vendorId,
        },
        { systemKey: "ACCOUNTS_PAYABLE", credit: total, propertyId, vendorId },
      ],
    });
    await tx.accountingVendorBill.update({
      where: { id: bill.id },
      data: { journalEntryId: journal.id },
    });
  });
  revalidatePath(PATH);
}

export async function payVendorBillAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const billId = text(formData, "billId");
  const paymentAmount = amount(formData, "amount");
  const paymentDate = new Date(text(formData, "paymentDate"));
  const paymentMethod = text(formData, "paymentMethod") || "BANK";

  if (!billId || Number.isNaN(paymentDate.getTime())) {
    throw new Error("Select a bill and payment date.");
  }

  await prisma.$transaction(async (tx) => {
    const bill = await tx.accountingVendorBill.findFirst({
      where: {
        id: billId,
        orgId,
        status: { in: ["APPROVED", "PARTIAL"] },
      },
      include: { vendor: true },
    });

    if (!bill) {
      throw new Error("Open vendor bill was not found.");
    }

    const balanceDue = Number(bill.total) - Number(bill.amountPaid);
    if (paymentAmount > balanceDue + 0.01) {
      throw new Error("Payment exceeds the remaining bill balance.");
    }

    const nextPaid = Number(bill.amountPaid) + paymentAmount;
    const nextStatus =
      nextPaid >= Number(bill.total) - 0.01 ? "PAID" : "PARTIAL";

    await postJournalEntry({
      db: tx,
      orgId,
      entryDate: paymentDate,
      description: `Payment to ${bill.vendor.name} · ${bill.billNumber}`,
      sourceType: "BILL_PAYMENT",
      sourceId: `${bill.id}:${Date.now()}`,
      userId: session.userId,
      lines: [
        {
          systemKey: "ACCOUNTS_PAYABLE",
          debit: paymentAmount,
          propertyId: bill.propertyId,
          vendorId: bill.vendorId,
        },
        {
          systemKey: cashSystemKey(paymentMethod),
          credit: paymentAmount,
          propertyId: bill.propertyId,
          vendorId: bill.vendorId,
        },
      ],
    });

    await tx.accountingVendorBill.update({
      where: { id: bill.id },
      data: {
        amountPaid: nextPaid,
        status: nextStatus,
      },
    });
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

  if (
    !debitAccountId ||
    !creditAccountId ||
    debitAccountId === creditAccountId ||
    description.length < 3 ||
    Number.isNaN(date.getTime())
  ) {
    throw new Error("Complete a valid balanced journal.");
  }

  await postJournalEntry({
    db: prisma,
    orgId: session.activeOrgId!,
    entryDate: date,
    description,
    memo: text(formData, "memo") || null,
    sourceType: "MANUAL",
    userId: session.userId,
    lines: [
      { accountId: debitAccountId, debit: value },
      { accountId: creditAccountId, credit: value },
    ],
  });
  revalidatePath(PATH);
}