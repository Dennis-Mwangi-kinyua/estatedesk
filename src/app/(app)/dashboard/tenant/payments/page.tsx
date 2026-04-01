import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const tenantPaymentsArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    payments: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        receipt: true,
        rentCharge: true,
        waterBill: true,
        taxCharge: true,
      },
    },
  },
});

type TenantPaymentsResult = Prisma.TenantGetPayload<typeof tenantPaymentsArgs>;

export default async function TenantPaymentsPage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const userId = session.userId;
  const orgId = session.activeOrgId;

  const tenant: TenantPaymentsResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantPaymentsArgs,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="mt-1 text-sm text-neutral-500">
          View your payment history and statuses
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {tenant?.payments?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-neutral-500">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3">Target</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Gateway</th>
                  <th className="px-3 py-3">Verification</th>
                  <th className="px-3 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {tenant.payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="px-3 py-3">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">{payment.method}</td>
                    <td className="px-3 py-3">{payment.targetType}</td>
                    <td className="px-3 py-3">
                      {Number(payment.amount).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">{payment.gatewayStatus}</td>
                    <td className="px-3 py-3">{payment.verificationStatus}</td>
                    <td className="px-3 py-3">
                      {payment.receipt?.receiptNo ?? "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No payments found.</p>
        )}
      </div>
    </div>
  );
}