import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const tenantInvoiceArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
        status: "ACTIVE",
      },
      orderBy: {
        startDate: "desc",
      },
      take: 1,
      include: {
        unit: {
          include: {
            building: true,
            property: true,
          },
        },
        rentCharges: {
          orderBy: {
            dueDate: "desc",
          },
          take: 12,
        },
      },
    },
  },
});

type TenantInvoiceResult = Prisma.TenantGetPayload<typeof tenantInvoiceArgs>;

export default async function TenantInvoicePage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const userId = session.userId;
  const orgId = session.activeOrgId;

  const tenant: TenantInvoiceResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantInvoiceArgs,
  });

  const activeLease = tenant?.leases?.[0];
  const unit = activeLease?.unit;
  const charges = activeLease?.rentCharges ?? [];

  const totalInvoiced = charges.reduce((sum: number, charge) => {
    return sum + Number(charge.amountDue ?? 0);
  }, 0);

  const totalBalance = charges.reduce((sum: number, charge) => {
    return sum + Number(charge.balance ?? 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="mt-1 text-sm text-neutral-500">
          View your rent invoices and outstanding balances
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Tenant</p>
          <p className="mt-2 text-lg font-semibold">
            {tenant?.fullName ?? session.fullName}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Unit</p>
          <p className="mt-2 text-lg font-semibold">
            {unit?.houseNo ?? "N/A"}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Property</p>
          <p className="mt-2 text-lg font-semibold">
            {unit?.property?.name ?? "N/A"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Total Invoiced</p>
          <p className="mt-2 text-2xl font-semibold">
            {totalInvoiced.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Outstanding Balance</p>
          <p className="mt-2 text-2xl font-semibold">
            {totalBalance.toLocaleString()}
          </p>
        </div>
      </section>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Invoice History</h2>

        <div className="mt-4">
          {charges.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-neutral-500">
                  <tr>
                    <th className="px-3 py-3">Period</th>
                    <th className="px-3 py-3">Due Date</th>
                    <th className="px-3 py-3">Amount Due</th>
                    <th className="px-3 py-3">Balance</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((charge) => (
                    <tr key={charge.id} className="border-b last:border-0">
                      <td className="px-3 py-3">{charge.period}</td>
                      <td className="px-3 py-3">
                        {new Date(charge.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        {Number(charge.amountDue).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        {Number(charge.balance).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">{charge.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No invoices found.</p>
          )}
        </div>
      </div>
    </div>
  );
}