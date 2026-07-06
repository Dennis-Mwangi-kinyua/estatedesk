import { notFound } from "next/navigation";
import {
  filterTenantPayments,
  formatDate,
  formatMoney,
  getPaymentCategory,
  getPaymentMethodLabel,
  getPaymentTitle,
} from "@/app/(app)/dashboard/tenant/payments/_lib/helpers";
import { tenantPaymentsArgs } from "@/app/(app)/dashboard/tenant/payments/_lib/types";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const session = await requireTenantAccess();

  if (!session.userId || !session.activeOrgId) {
    notFound();
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    ...tenantPaymentsArgs,
  });

  if (!tenant) {
    notFound();
  }

  const payments = filterTenantPayments(tenant.payments ?? []);
  const generatedAt = new Date().toISOString();

  const header = [
    "Date",
    "Title",
    "Category",
    "Method",
    "Amount (KES)",
    "Reference",
    "Gateway status",
    "Verification status",
  ];

  const rows = payments.map((payment) => [
    formatDate(payment.paidAt || payment.createdAt),
    getPaymentTitle(payment),
    getPaymentCategory(payment),
    getPaymentMethodLabel(payment.method),
    formatMoney(payment.amount).replace(/[^\d.,-]/g, ""),
    payment.reference || payment.externalReference || "",
    payment.gatewayStatus,
    payment.verificationStatus,
  ]);

  const csv = [
    `Tenant payment statement`,
    `Tenant,${csvEscape(tenant.fullName)}`,
    `Generated,${generatedAt}`,
    "",
    header.join(","),
    ...rows.map((row) => row.map((cell) => csvEscape(String(cell))).join(",")),
  ].join("\n");

  const filename = `tenant-payment-statement-${tenant.id.slice(0, 8)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}