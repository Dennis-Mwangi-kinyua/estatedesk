import { emptyPaymentInstructions } from "@/lib/payments/instructions";
import { requireUserSession } from "@/lib/auth/session";
import { getTenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";
import { ProfileWorkspace } from "./_components/profile-workspace";
import { getTenantProfileData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type TenantProfilePageProps = {
  searchParams?: Promise<{
    passwordUpdated?: string;
  }>;
};

export default async function TenantProfilePage({
  searchParams,
}: TenantProfilePageProps) {
  const session = await requireUserSession();
  const params = await searchParams;

  const { tenant, paymentHealth, paymentInstructions } =
    await getTenantProfileData(session.userId, session.activeOrgId);

  if (!tenant) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
        No tenant profile is linked to your account.
      </div>
    );
  }

  const activeLease = tenant.leases[0];
  const portalContext = await getTenantPortalContext(
    session.userId,
    session.activeOrgId,
    {
      leaseId: activeLease?.id,
      unitId: activeLease?.unit.id,
      propertyId: activeLease?.unit.propertyId,
      buildingId: activeLease?.unit.buildingId,
    },
  );

  return (
    <ProfileWorkspace
      data={{
        tenant,
        paymentHealth,
        paymentInstructions: paymentInstructions ?? emptyPaymentInstructions,
        portalContext,
        showPasswordUpdated: params?.passwordUpdated === "1",
      }}
    />
  );
}