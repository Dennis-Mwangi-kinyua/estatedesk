import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const tenantProfileArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    nextOfKin: true,
    profileImage: true,
  },
});

type TenantProfileResult = Prisma.TenantGetPayload<typeof tenantProfileArgs>;

export default async function TenantProfilePage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const userId = session.userId;
  const orgId = session.activeOrgId;

  const tenant: TenantProfileResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantProfileArgs,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your account and contact details
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-neutral-500">Full Name</p>
            <p className="font-medium">{tenant?.fullName ?? "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-neutral-500">Tenant Type</p>
            <p className="font-medium">{tenant?.type ?? "N/A"}</p>
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
            <p className="text-sm text-neutral-500">KRA PIN</p>
            <p className="font-medium">{tenant?.kraPin ?? "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-neutral-500">Status</p>
            <p className="font-medium">{tenant?.status ?? "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-neutral-500">Marketing Consent</p>
            <p className="font-medium">
              {tenant?.marketingConsent ? "Granted" : "Not granted"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Next of Kin</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-neutral-500">Name</p>
            <p className="font-medium">{tenant?.nextOfKin?.name ?? "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-neutral-500">Relationship</p>
            <p className="font-medium">
              {tenant?.nextOfKin?.relationship ?? "N/A"}
            </p>
          </div>

          <div>
            <p className="text-sm text-neutral-500">Phone</p>
            <p className="font-medium">{tenant?.nextOfKin?.phone ?? "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-neutral-500">Email</p>
            <p className="font-medium">{tenant?.nextOfKin?.email ?? "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}