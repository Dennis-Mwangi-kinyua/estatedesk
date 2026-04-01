import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const tenantLeaseArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
      },
      orderBy: {
        startDate: "desc",
      },
      include: {
        unit: {
          include: {
            building: true,
            property: true,
          },
        },
        contractDocument: true,
        rentCharges: {
          orderBy: {
            dueDate: "desc",
          },
          take: 10,
        },
      },
    },
  },
});

type TenantLeaseResult = Prisma.TenantGetPayload<typeof tenantLeaseArgs>;

export default async function TenantLeasePage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const userId = session.userId;
  const orgId = session.activeOrgId;

  const tenant: TenantLeaseResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantLeaseArgs,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">My Lease</h1>
        <p className="mt-1 text-sm text-neutral-500">
          View your lease and tenancy details
        </p>
      </div>

      {tenant?.leases?.length ? (
        tenant.leases.map((lease) => (
          <div key={lease.id} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {lease.unit.property.name} - {lease.unit.houseNo}
                </h2>
                <p className="text-sm text-neutral-500">
                  {lease.unit.building?.name ?? "No building"} • {lease.status}
                </p>
              </div>

              <div className="text-sm text-neutral-500">
                Monthly Rent: {Number(lease.monthlyRent).toLocaleString()}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-neutral-500">Start Date</p>
                <p className="font-medium">
                  {new Date(lease.startDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-neutral-500">End Date</p>
                <p className="font-medium">
                  {lease.endDate
                    ? new Date(lease.endDate).toLocaleDateString()
                    : "Open-ended"}
                </p>
              </div>

              <div>
                <p className="text-sm text-neutral-500">Due Day</p>
                <p className="font-medium">{lease.dueDay}</p>
              </div>

              <div>
                <p className="text-sm text-neutral-500">Deposit</p>
                <p className="font-medium">
                  {lease.deposit != null
                    ? Number(lease.deposit).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-base font-semibold">Recent Charges</h3>
              <div className="mt-3 space-y-3">
                {lease.rentCharges.length ? (
                  lease.rentCharges.map((charge) => (
                    <div key={charge.id} className="rounded-xl border p-3 text-sm">
                      <p className="font-medium">{charge.period}</p>
                      <p>Status: {charge.status}</p>
                      <p>Amount Due: {Number(charge.amountDue).toLocaleString()}</p>
                      <p>Balance: {Number(charge.balance).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500">No charges found.</p>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">No lease records found.</p>
        </div>
      )}
    </div>
  );
}