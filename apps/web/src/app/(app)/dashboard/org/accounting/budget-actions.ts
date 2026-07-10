"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";

const PATH = "/dashboard/org/accounting/budgets";
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const number = (form: FormData, key: string) => Number(text(form, key));

async function accountingSession() {
  return requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
}

function revalidateBudgets() {
  revalidatePath(PATH);
  revalidatePath("/dashboard/org/accounting/reports");
}

export async function createBudgetAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const periodId = text(formData, "periodId");
  const name = text(formData, "name");

  if (name.length < 2) {
    throw new Error("Budget name is required.");
  }

  const period = await prisma.accountingPeriod.findFirst({
    where: { id: periodId, orgId },
    select: { id: true },
  });

  if (!period) {
    throw new Error("Select a valid accounting period.");
  }

  const budget = await prisma.accountingBudget.create({
    data: { orgId, periodId, name },
  });

  revalidateBudgets();
  redirect(`${PATH}?budgetId=${budget.id}&message=Budget ${name} created`);
}

export async function upsertBudgetLineAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const budgetId = text(formData, "budgetId");
  const accountId = text(formData, "accountId");
  const amount = number(formData, "amount");

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Enter a valid budget amount.");
  }

  const budget = await prisma.accountingBudget.findFirst({
    where: { id: budgetId, orgId, status: "DRAFT" },
    select: { id: true },
  });

  if (!budget) {
    throw new Error("Only draft budgets can be edited.");
  }

  const existing = await prisma.accountingBudgetLine.findFirst({
    where: { budgetId, accountId },
    select: { id: true },
  });

  if (existing) {
    await prisma.accountingBudgetLine.update({
      where: { id: existing.id },
      data: { amount },
    });
  } else {
    await prisma.accountingBudgetLine.create({
      data: { budgetId, accountId, amount },
    });
  }

  revalidateBudgets();
  redirect(`${PATH}?budgetId=${budgetId}&message=Budget line saved`);
}

export async function approveBudgetAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const budgetId = text(formData, "budgetId");

  const budget = await prisma.accountingBudget.findFirst({
    where: { id: budgetId, orgId, status: "DRAFT" },
    include: { lines: true },
  });

  if (!budget) {
    throw new Error("Draft budget was not found.");
  }

  if (budget.lines.length === 0) {
    throw new Error("Add at least one budget line before approving.");
  }

  await prisma.accountingBudget.update({
    where: { id: budgetId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedByUserId: session.userId,
    },
  });

  revalidateBudgets();
  redirect(`${PATH}?budgetId=${budgetId}&message=Budget approved`);
}