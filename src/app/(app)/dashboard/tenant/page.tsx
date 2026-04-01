import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const tenantDashboardArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    nextOfKin: true,
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
          take: 5,
        },
      },
    },
    payments: {
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    },
  },
});

type TenantDashboardResult = Prisma.TenantGetPayload<
  typeof tenantDashboardArgs
>;

export default async function TenantDashboardPage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const userId = session.userId;
  const orgId = session.activeOrgId;

  const tenant: TenantDashboardResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantDashboardArgs,
  });

  const activeLease = tenant?.leases?.[0];
  const currentUnit = activeLease?.unit;

  const outstandingBalance =
    activeLease?.rentCharges?.reduce((sum: number, charge) => {
      return sum + Number(charge.balance ?? 0);
    }, 0) ?? 0;

  const recentPaymentsTotal =
    tenant?.payments?.reduce((sum: number, payment) => {
      return sum + Number(payment.amount ?? 0);
    }, 0) ?? 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Tenant</p>
          <p className="mt-2 text-lg font-semibold">
            {tenant?.fullName ?? session.fullName}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Current Unit</p>
          <p className="mt-2 text-lg font-semibold">
            {currentUnit?.houseNo ?? "N/A"}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Monthly Rent</p>
          <p className="mt-2 text-lg font-semibold">
            {activeLease
              ? Number(activeLease.monthlyRent).toLocaleString()
              : "N/A"}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Outstanding Balance</p>
          <p className="mt-2 text-lg font-semibold">
            {outstandingBalance.toLocaleString()}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Tenant Details</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Your personal and tenancy information
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-neutral-500">Status</p>
              <p className="font-medium">{tenant?.status ?? "N/A"}</p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Phone</p>
              <p className="font-medium">{tenant?.phone ?? "N/A"}</p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Email</p>
              <p className="font-medium">{tenant?.email ?? "N/A"}</p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">National ID</p>
              <p className="font-medium">{tenant?.nationalId ?? "N/A"}</p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Property</p>
              <p className="font-medium">
                {currentUnit?.property?.name ?? "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Building</p>
              <p className="font-medium">
                {currentUnit?.building?.name ?? "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Lease Start</p>
              <p className="font-medium">
                {activeLease?.startDate
                  ? new Date(activeLease.startDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Lease End</p>
              <p className="font-medium">
                {activeLease?.endDate
                  ? new Date(activeLease.endDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Due Day</p>
              <p className="font-medium">{activeLease?.dueDay ?? "N/A"}</p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Deposit</p>
              <p className="font-medium">
                {activeLease?.deposit != null
                  ? Number(activeLease.deposit).toLocaleString()
                  : "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Next of Kin</p>
              <p className="font-medium">{tenant?.nextOfKin?.name ?? "N/A"}</p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">Relationship</p>
              <p className="font-medium">
                {tenant?.nextOfKin?.relationship ?? "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Quick Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <p>Role: {session.activeOrgRole}</p>
              <p>Organization: {orgId}</p>
              <p>
                Recent payments total: {recentPaymentsTotal.toLocaleString()}
              </p>
              <p>Recent rent charges: {activeLease?.rentCharges?.length ?? 0}</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Recent Charges</h2>
            <div className="mt-4 space-y-3">
              {activeLease?.rentCharges?.length ? (
                activeLease.rentCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="rounded-xl border p-3 text-sm"
                  >
                    <p className="font-medium">{charge.period}</p>
                    <p className="text-neutral-500">
                      Due: {new Date(charge.dueDate).toLocaleDateString()}
                    </p>
                    <p>Balance: {Number(charge.balance).toLocaleString()}</p>
                    <p>Status: {charge.status}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500">
                  No recent rent charges found.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}