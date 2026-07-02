"use server";

import { revalidatePath } from "next/cache";
import { ExpenditureCategory } from "@prisma/client";
import { postJournalEntry } from "@/lib/accounting/engine";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";

const PATH = "/dashboard/org/expenditures";
const read = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

const EXPENSE_ACCOUNT: Record<string, string> = {
  MAINTENANCE: "REPAIRS_EXPENSE", TENANT_REPAIR: "REPAIRS_EXPENSE",
  UTILITIES: "UTILITIES_EXPENSE", ADMINISTRATION: "MANAGEMENT_EXPENSE",
  LEGAL: "MANAGEMENT_EXPENSE", STAFF: "MANAGEMENT_EXPENSE",
  TAX: "TAX_EXPENSE",
};

export async function createOrganizationExpenditureAction(formData: FormData) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const description = read(formData, "description");
  const categoryValue = read(formData, "category");
  const category = Object.values(ExpenditureCategory).includes(categoryValue as ExpenditureCategory)
    ? categoryValue as ExpenditureCategory
    : ExpenditureCategory.OTHER;
  const amount = Number(read(formData, "amount"));
  const incurredAt = new Date(read(formData, "incurredAt"));
  const tenantId = read(formData, "tenantId") || null;
  const propertyId = read(formData, "propertyId") || null;
  const paid = formData.get("paid") === "on";
  if (description.length < 3 || !Number.isFinite(amount) || amount <= 0 || Number.isNaN(incurredAt.getTime())) {
    throw new Error("Complete a valid expenditure description, amount, and date.");
  }

  await prisma.$transaction(async (tx) => {
    const org = await tx.organization.findUniqueOrThrow({ where: { id: orgId }, select: { currencyCode: true } });
    if (tenantId) {
      const tenant = await tx.tenant.findFirst({ where: { id: tenantId, orgId }, select: { id: true } });
      if (!tenant) throw new Error("Tenant does not belong to this organization.");
    }
    const expenditure = await tx.expenditure.create({
      data: {
        scope: tenantId ? "TENANT" : "ORGANIZATION", orgId, tenantId, propertyId,
        category: category || "OTHER", description, amount, currencyCode: org.currencyCode,
        incurredAt, paidAt: paid ? incurredAt : null, status: paid ? "PAID" : "RECORDED",
        payee: read(formData, "payee") || null, reference: read(formData, "reference") || null,
        paymentMethod: read(formData, "paymentMethod") || null,
        chargeable: formData.get("chargeable") === "on", notes: read(formData, "notes") || null,
        createdByUserId: session.userId,
      },
    });
    if (paid) {
      const journal = await postJournalEntry({
        db: tx, orgId, entryDate: incurredAt, description, sourceType: "EXPENDITURE",
        sourceId: expenditure.id, userId: session.userId,
        lines: [
          { systemKey: EXPENSE_ACCOUNT[category] ?? "OTHER_EXPENSE", debit: amount, propertyId, tenantId },
          { systemKey: read(formData, "paymentMethod") === "CASH" ? "CASH" : "BANK", credit: amount, propertyId, tenantId },
        ],
      });
      await tx.expenditure.update({ where: { id: expenditure.id }, data: { journalEntryId: journal.id } });
    }
  });
  revalidatePath(PATH);
  revalidatePath("/dashboard/org/accounting");
  revalidatePath("/dashboard/tenant/expenditures");
}
