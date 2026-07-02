"use server";

import { revalidatePath } from "next/cache";
import { ExpenditureCategory } from "@prisma/client";
import { isSupportedCurrency } from "@/lib/currencies";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";

export async function createPlatformExpenditureAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const currencyCode = String(formData.get("currencyCode") ?? "").toUpperCase();
  const incurredAt = new Date(String(formData.get("incurredAt") ?? ""));
  const categoryValue = String(formData.get("category") ?? "OTHER");
  const category = Object.values(ExpenditureCategory).includes(categoryValue as ExpenditureCategory)
    ? categoryValue as ExpenditureCategory
    : ExpenditureCategory.OTHER;
  if (description.length < 3 || !Number.isFinite(amount) || amount <= 0 || !isSupportedCurrency(currencyCode) || Number.isNaN(incurredAt.getTime())) {
    throw new Error("Complete a valid platform expenditure.");
  }
  const paid = formData.get("paid") === "on";
  await prisma.expenditure.create({
    data: {
      scope: "PLATFORM", category,
      description, amount, currencyCode, incurredAt, paidAt: paid ? incurredAt : null,
      status: paid ? "PAID" : "RECORDED", payee: String(formData.get("payee") ?? "").trim() || null,
      reference: String(formData.get("reference") ?? "").trim() || null,
      paymentMethod: String(formData.get("paymentMethod") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null, createdByUserId: session.userId,
    },
  });
  revalidatePath("/platform/expenditures");
}
