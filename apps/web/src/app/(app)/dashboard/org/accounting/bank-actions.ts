"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureDefaultBankAccounts } from "@/lib/accounting/bank-accounts";
import {
  completeBankReconciliation,
  createBankReconciliation,
} from "@/lib/accounting/bank-reconciliation";
import { importGlBankStatement } from "@/lib/accounting/bank-statement-gl";
import { ensureAccountingFoundation } from "@/lib/accounting/engine";
import { parseBankStatement } from "@/lib/payments/bank-statement";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import type { AccountingBankAccountType } from "@prisma/client";

const PATH = "/dashboard/org/accounting/bank";
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const number = (form: FormData, key: string) => Number(text(form, key));

async function accountingSession() {
  return requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
}

function revalidateBank() {
  revalidatePath(PATH);
  revalidatePath("/dashboard/org/accounting");
}

export async function createBankAccountAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const name = text(formData, "name");
  const ledgerAccountId = text(formData, "ledgerAccountId");
  const type = text(formData, "type") as AccountingBankAccountType;
  const institutionName = text(formData, "institutionName") || null;
  const accountNumberMasked = text(formData, "accountNumberMasked") || null;

  if (name.length < 2) {
    throw new Error("Bank account name is required.");
  }

  await prisma.$transaction(async (tx) => {
    await ensureAccountingFoundation(tx, orgId);

    const ledgerAccount = await tx.accountingAccount.findFirst({
      where: { id: ledgerAccountId, orgId, type: "ASSET", isActive: true },
      select: { id: true },
    });

    if (!ledgerAccount) {
      throw new Error("Select a valid asset ledger account.");
    }

    await tx.accountingBankAccount.create({
      data: {
        orgId,
        name,
        ledgerAccountId,
        type,
        institutionName,
        accountNumberMasked,
      },
    });
  });

  revalidateBank();
  redirect(`${PATH}?message=Bank account ${name} created`);
}

export async function startBankReconciliationAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const bankAccountId = text(formData, "bankAccountId");
  const periodEnd = text(formData, "periodEnd");
  const statementBalance = number(formData, "statementBalance");
  const notes = text(formData, "notes") || null;
  const clearedJournalLineIds = formData
    .getAll("clearedJournalLineIds")
    .map((value) => String(value));

  if (!periodEnd) {
    throw new Error("Reconciliation date is required.");
  }

  if (!Number.isFinite(statementBalance)) {
    throw new Error("Enter a valid statement balance.");
  }

  const reconciliation = await createBankReconciliation({
    db: prisma,
    orgId,
    bankAccountId,
    periodEnd: new Date(periodEnd),
    statementBalance,
    notes,
    clearedJournalLineIds,
  });

  revalidateBank();
  redirect(
    `${PATH}?bankAccountId=${bankAccountId}&message=Reconciliation draft ${reconciliation.id.slice(0, 8)} started`,
  );
}

export async function completeBankReconciliationAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const reconciliationId = text(formData, "reconciliationId");
  const bankAccountId = text(formData, "bankAccountId");

  await completeBankReconciliation(prisma, orgId, reconciliationId, session.userId);

  revalidateBank();
  redirect(`${PATH}?bankAccountId=${bankAccountId}&message=Reconciliation completed`);
}

export async function importGlBankStatementAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const bankAccountId = text(formData, "bankAccountId");
  const file = formData.get("statement");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a bank statement CSV file.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Bank statement CSV must be 2 MB or smaller.");
  }

  const rows = parseBankStatement(await file.text());
  const result = await importGlBankStatement({
    db: prisma,
    orgId,
    bankAccountId,
    rows,
    userId: session.userId,
  });

  revalidateBank();
  redirect(
    `${PATH}?bankAccountId=${bankAccountId}&message=Statement import: ${result.matched} matched, ${result.unmatched} unmatched`,
  );
}

export async function seedBankAccountsAction() {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;

  await prisma.$transaction(async (tx) => {
    await ensureAccountingFoundation(tx, orgId);
    await ensureDefaultBankAccounts(tx, orgId);
  });

  revalidateBank();
  redirect(`${PATH}?message=Default bank accounts ready`);
}