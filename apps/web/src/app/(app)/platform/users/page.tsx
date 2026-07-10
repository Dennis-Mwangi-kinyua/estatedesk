import { requirePlatformRole } from "@/lib/permissions/guards";
import { getPlatformUsersPageData } from "./_lib/queries";
import type { UsersSearchParams } from "./_lib/types";
import { UsersWorkspace } from "./_components/users-workspace";

export const dynamic = "force-dynamic";

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: UsersSearchParams;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const params = await searchParams;
  const data = await getPlatformUsersPageData(params);

  return <UsersWorkspace data={data} flash={params} />;
}