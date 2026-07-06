import { requireManagementAccess } from "@/lib/permissions/guards";
import { LeasesWorkspace } from "./_components/leases-workspace";
import { getOrgLeasesPageData } from "./_lib/queries";
import type { LeasesPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function LeasesPage({ searchParams }: LeasesPageProps) {
  const session = await requireManagementAccess();
  const resolvedSearchParams = (await searchParams) ?? {};

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const data = await getOrgLeasesPageData(
    session.activeOrgId,
    Number(resolvedSearchParams.page ?? "1"),
  );

  return <LeasesWorkspace data={data} orgRole={session.activeOrgRole} />;
}