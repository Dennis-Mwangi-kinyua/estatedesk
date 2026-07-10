"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canDeactivateAccount,
  isLockedSystemAccount,
  normalBalanceForAccountType,
  validateAccountCode,
} from "@/lib/accounting/accounts";
import { ensureAccountingFoundation } from "@/lib/accounting/engine";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import type { AccountingAccountType } from "@prisma/client";

const PATH = "/dashboard/org/accounting/coa";
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

async function accountingSession() {
  return requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
}

function revalidateCoa() {
  revalidatePath(PATH);
  revalidatePath("/dashboard/org/accounting");
  revalidatePath("/dashboard/org/accounting/journals");
}

export async function createAccountingAccountAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const code = validateAccountCode(text(formData, "code"));
  const name = text(formData, "name");
  const type = text(formData, "type") as AccountingAccountType;
  const parentId = text(formData, "parentId") || null;
  const description = text(formData, "description") || null;

  if (name.length < 2) {
    throw new Error("Account name is required.");
  }

  if (!["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].includes(type)) {
    throw new Error("Select a valid account type.");
  }

  await prisma.$transaction(async (tx) => {
    await ensureAccountingFoundation(tx, orgId);

    if (parentId) {
      const parent = await tx.accountingAccount.findFirst({
        where: { id: parentId, orgId, isActive: true },
        select: { id: true, type: true },
      });
      if (!parent) {
        throw new Error("Parent account was not found.");
      }
      if (parent.type !== type) {
        throw new Error("Child accounts must use the same type as their parent.");
      }
    }

    await tx.accountingAccount.create({
      data: {
        orgId,
        parentId,
        code,
        name,
        type,
        normalBalance: normalBalanceForAccountType(type),
        description,
      },
    });
  });

  revalidateCoa();
  redirect(`${PATH}?message=Account ${code} created`);
}

export async function updateAccountingAccountAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const accountId = text(formData, "accountId");
  const name = text(formData, "name");
  const description = text(formData, "description") || null;
  const parentId = text(formData, "parentId") || null;

  if (!accountId || name.length < 2) {
    throw new Error("Account details are incomplete.");
  }

  const account = await prisma.accountingAccount.findFirst({
    where: { id: accountId, orgId },
    select: { id: true, type: true, systemKey: true, isControl: true },
  });

  if (!account) {
    throw new Error("Account was not found.");
  }

  if (parentId) {
    if (parentId === accountId) {
      throw new Error("An account cannot be its own parent.");
    }

    const parent = await prisma.accountingAccount.findFirst({
      where: { id: parentId, orgId, isActive: true },
      select: { type: true },
    });

    if (!parent || parent.type !== account.type) {
      throw new Error("Choose a valid parent account with the same type.");
    }
  }

  await prisma.accountingAccount.update({
    where: { id: accountId },
    data: {
      name,
      description,
      parentId,
      ...(isLockedSystemAccount(account) ? {} : {}),
    },
  });

  revalidateCoa();
  redirect(`${PATH}?message=Account updated`);
}

export async function setAccountingAccountActiveAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const accountId = text(formData, "accountId");
  const isActive = text(formData, "isActive") === "true";

  const account = await prisma.accountingAccount.findFirst({
    where: { id: accountId, orgId },
    select: { systemKey: true, isControl: true, code: true },
  });

  if (!account) {
    throw new Error("Account was not found.");
  }

  if (!isActive && !canDeactivateAccount(account)) {
    throw new Error("System control accounts cannot be deactivated.");
  }

  await prisma.accountingAccount.update({
    where: { id: accountId },
    data: { isActive },
  });

  revalidateCoa();
  redirect(
    `${PATH}?message=Account ${account.code} ${isActive ? "activated" : "deactivated"}`,
  );
}