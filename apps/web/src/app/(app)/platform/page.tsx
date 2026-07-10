import { requirePlatformRole } from "@/lib/permissions/guards";
import { PlatformDashboard } from "./_components/platform-dashboard";
import { getPlatformDashboardData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function PlatformPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const data = await getPlatformDashboardData();

  return <PlatformDashboard data={data} />;
}