import { redirect } from "next/navigation";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { loadUnitsPageData } from "./_lib/queries";
import type { UnitsPageProps } from "./_lib/types";
import { UnitsWorkspace } from "./_components/units-workspace";

export const dynamic = "force-dynamic";

export default async function UnitsPage({ searchParams }: UnitsPageProps) {
  const session = await requireManagementAccess();

  if (!session.activeOrgId) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await loadUnitsPageData(session, resolvedSearchParams);

  return <UnitsWorkspace data={data} orgRole={session.activeOrgRole} />;
}