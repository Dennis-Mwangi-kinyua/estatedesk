import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const tenantMaintenanceArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        status: "ACTIVE",
        deletedAt: null,
      },
      take: 1,
      orderBy: {
        startDate: "desc",
      },
      include: {
        unit: true,
      },
    },
  },
});

type TenantMaintenanceResult =
  Prisma.TenantGetPayload<typeof tenantMaintenanceArgs>;

export default async function TenantMaintenancePage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const userId = session.userId;
  const orgId = session.activeOrgId;

  const tenant: TenantMaintenanceResult | null =
    await prisma.tenant.findFirst({
      where: {
        userId,
        orgId,
        deletedAt: null,
      },
      ...tenantMaintenanceArgs,
    });

  const unitId = tenant?.leases?.[0]?.unitId;

  const issues = unitId
    ? await prisma.issueTicket.findMany({
        where: {
          orgId,
          unitId,
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Maintenance</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track issues related to your current unit
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Reported Issues</h2>

        <div className="mt-4 space-y-4">
          {issues.length ? (
            issues.map((issue) => (
              <div key={issue.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{issue.title}</p>
                    <p className="text-sm text-neutral-500">
                      {issue.description}
                    </p>
                  </div>

                  <div className="text-right text-sm">
                    <p>{issue.priority}</p>
                    <p className="text-neutral-500">{issue.status}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-neutral-500">
                  Created {new Date(issue.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-500">
              No maintenance issues found for your current unit.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}