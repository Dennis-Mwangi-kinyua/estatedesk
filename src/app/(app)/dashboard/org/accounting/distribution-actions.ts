"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendOwnerStatementToLandlord } from "@/lib/accounting/owner-statement-delivery";
import { postOwnerDistribution } from "@/lib/accounting/owner-distributions";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";

const PATH = "/dashboard/org/accounting/distributions";
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const number = (form: FormData, key: string) => Number(text(form, key));

async function accountingSession() {
  return requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
}

function revalidateDistributions() {
  revalidatePath(PATH);
  revalidatePath("/dashboard/org/accounting");
  revalidatePath("/dashboard/org/accounting/journals");
}

export async function postOwnerDistributionAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const landlordId = text(formData, "landlordId");
  const amount = number(formData, "amount");
  const paymentMethod = text(formData, "paymentMethod") || "BANK";
  const entryDate = text(formData, "entryDate");
  const description = text(formData, "description");
  const propertyId = text(formData, "propertyId") || null;

  if (!entryDate) {
    throw new Error("Distribution date is required.");
  }

  await postOwnerDistribution({
    db: prisma,
    orgId,
    landlordId,
    amount,
    paymentMethod,
    entryDate: new Date(entryDate),
    description,
    propertyId,
    userId: session.userId,
  });

  revalidateDistributions();
  redirect(`${PATH}?message=Owner distribution posted`);
}

export async function emailOwnerStatementAction(formData: FormData) {
  const session = await accountingSession();
  const orgId = session.activeOrgId!;
  const landlordId = text(formData, "landlordId");
  const from = text(formData, "from");
  const to = text(formData, "to");

  if (!from || !to) {
    throw new Error("Statement period is required.");
  }

  const result = await sendOwnerStatementToLandlord({
    db: prisma,
    orgId,
    landlordId,
    from: new Date(from),
    to: new Date(to),
    actorUserId: session.userId,
  });

  revalidateDistributions();
  redirect(
    `${PATH}?landlordId=${landlordId}&from=${from}&to=${to}&message=Statement emailed to ${result.email}`,
  );
}