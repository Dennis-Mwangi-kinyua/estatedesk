import { redirect } from "next/navigation";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { getBuildingsPageData } from "./_lib/queries";
import { BuildingsWorkspace } from "./_components/buildings-workspace";
import type { BuildingsPageProps } from "./_lib/types";


export const dynamic = "force-dynamic";

export default async function BuildingsPage({ searchParams }: BuildingsPageProps) {
  const session = await requireManagementAccess();
  if (!session.activeOrgId) redirect("/dashboard");
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const data = await getBuildingsPageData(
    session,
    query,
    Number(resolvedSearchParams?.page ?? "1"),
  );

  return <BuildingsWorkspace data={data} orgRole={session.activeOrgRole} />;
}
