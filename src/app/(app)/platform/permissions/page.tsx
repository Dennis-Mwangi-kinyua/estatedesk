import { requirePlatformRole } from "@/lib/permissions/guards";
import { PermissionsWorkspace } from "./_components/permissions-workspace";
import { getAdminPermissionsPageData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminPermissionsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const data = await getAdminPermissionsPageData();

  return <PermissionsWorkspace data={data} />;
}