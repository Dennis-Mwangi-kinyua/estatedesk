import { requirePlatformRole } from "@/lib/permissions/guards";
import { OrgDetailWorkspace } from "./_components/org-detail-workspace";
import { getOrganizationDetailData } from "./_lib/queries";
import type { PageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function PlatformOrganizationDetailPage({
  params,
  searchParams,
}: PageProps) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const { slug } = await params;
  const statusParams = await searchParams;
  const data = await getOrganizationDetailData({ slug }, statusParams);

  return <OrgDetailWorkspace {...data} />;
}
