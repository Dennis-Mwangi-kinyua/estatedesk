import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatCurrency,
  formatDateTime,
  labelize,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

export default async function PaymentOpsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const [pending, failed, rejected, missingReceipt, payments] = await Promise.all([
    prisma.payment.count({ where: { verificationStatus: "PENDING" } }),
    prisma.payment.count({ where: { gatewayStatus: "FAILED" } }),
    prisma.payment.count({ where: { verificationStatus: "REJECTED" } }),
    prisma.payment.count({
      where: { verificationStatus: "VERIFIED", receipt: null },
    }),
    prisma.payment.findMany({
      where: {
        OR: [
          { verificationStatus: "PENDING" },
          { verificationStatus: "REJECTED" },
          { gatewayStatus: "FAILED" },
          { gatewayStatus: "PENDING" },
          { gatewayStatus: "INITIATED" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        org: { select: { id: true, name: true, slug: true } },
        payerTenant: { select: { fullName: true } },
      },
    }),
  ]);

  const totalValue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payment operations"
        title="Callbacks and reconciliation"
        description="Payments requiring platform attention: pending verification, rejected records, failed gateways, and verified payments missing receipts."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending verification" value={pending} />
        <StatCard label="Gateway failed" value={failed} />
        <StatCard label="Rejected" value={rejected} />
        <StatCard label="Missing receipts" value={missingReceipt} note={formatCurrency(totalValue)} />
      </section>

      <Surface title="Attention queue">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Payer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Gateway</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <AdminLink href={`/platform/organizations/${payment.org.id}`}>
                      {payment.org.name}
                    </AdminLink>
                    <p className="mt-1 text-xs text-neutral-500">/{payment.org.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {payment.payerTenant?.fullName ?? payment.payerName ?? payment.payerType}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(Number(payment.amount))}</td>
                  <td className="px-4 py-3 text-neutral-600">{labelize(payment.targetType)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(payment.gatewayStatus)}>{payment.gatewayStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(payment.verificationStatus)}>
                      {payment.verificationStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {payment.reference ?? payment.externalReference ?? payment.checkoutRequestId ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{formatDateTime(payment.createdAt)}</td>
                </tr>
              ))}
              {payments.length === 0 ? (
                <EmptyRow colSpan={8} label="No payment operations need attention." />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
