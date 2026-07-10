"use server";

import { revalidatePath } from "next/cache";
import { ExpenditureCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";

export async function createTenantExpenditureAction(formData: FormData) {
  const session = await requireTenantAccess();
  const tenant = await prisma.tenant.findFirst({
    where: { orgId: session.activeOrgId!, userId: session.userId, deletedAt: null },
    include: { org: { select: { currencyCode: true } }, leases: { where: { status: "ACTIVE", deletedAt: null }, select: { unit: { select: { id: true, propertyId: true } } }, take: 1 } },
  });
  if (!tenant) throw new Error("Tenant profile not found.");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const incurredAt = new Date(String(formData.get("incurredAt") ?? ""));
  const allowedCategories: ExpenditureCategory[] = ["TENANT_REPAIR", "TENANT_SERVICE", "TRANSPORT", "OTHER"];
  const categoryValue = String(formData.get("category") ?? "OTHER") as ExpenditureCategory;
  const category = allowedCategories.includes(categoryValue) ? categoryValue : ExpenditureCategory.OTHER;
  if (description.length < 3 || !Number.isFinite(amount) || amount <= 0 || Number.isNaN(incurredAt.getTime())) throw new Error("Complete a valid expenditure.");
  const unit = tenant.leases[0]?.unit;
  await prisma.expenditure.create({ data: {
    scope: "TENANT", orgId: tenant.orgId, tenantId: tenant.id, unitId: unit?.id, propertyId: unit?.propertyId,
    category, description, amount,
    currencyCode: tenant.org.currencyCode, incurredAt, status: "RECORDED",
    payee: String(formData.get("payee") ?? "").trim() || null,
    reference: String(formData.get("reference") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null, createdByUserId: session.userId,
  }});
  revalidatePath("/dashboard/tenant/expenditures");
  revalidatePath("/dashboard/org/expenditures");
}
