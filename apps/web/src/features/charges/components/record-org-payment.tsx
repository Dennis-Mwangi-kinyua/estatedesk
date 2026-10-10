import { prisma } from "@/lib/prisma";
import { RecordOrgPaymentForm } from "./record-org-payment-form";

export async function RecordOrgPayment({ orgId, tenantId }: { orgId: string; tenantId?: string }) {
  const charges = await prisma.rentCharge.findMany({ where: { orgId, balance: { gt: 0 }, status: { not: "WAIVED" }, lease: { tenantId, deletedAt: null, tenant: { deletedAt: null } } }, orderBy: [{ dueDate: "asc" }, { id: "asc" }], include: { lease: { select: { tenant: { select: { fullName: true } }, unit: { select: { houseNo: true } } } } } });
  return <RecordOrgPaymentForm options={charges.map(charge => ({ id: charge.id, amount: charge.balance.toFixed(2), label: `${charge.lease.tenant.fullName} · ${charge.lease.unit.houseNo} · ${charge.period} · ${charge.chargeType.replaceAll("_", " ")} · ${charge.balance.toFixed(2)}` }))} />;
}
