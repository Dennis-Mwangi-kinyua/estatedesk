import { requireUserSession } from "@/lib/auth/session";
import { ProfileWorkspace } from "./_components/profile-workspace";
import { getTenantProfileData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function TenantProfilePage() {
  const session = await requireUserSession();
  const { tenant, paymentHealth } = await getTenantProfileData(
    session.userId,
    session.activeOrgId,
  );

  if (!tenant) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
        No tenant profile is linked to your account.
      </div>
    );
  }

  return <ProfileWorkspace tenant={tenant} paymentHealth={paymentHealth} />;
}