import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { MaintenanceWorkspace } from "./_components/maintenance-workspace";
import { clampPage } from "./_lib/helpers";
import { getTenantMaintenanceData } from "./_lib/queries";
import type { TenantMaintenancePageProps } from "./_lib/types";

export default async function TenantMaintenancePage({
  searchParams,
}: TenantMaintenancePageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedPage = Number(resolvedSearchParams.page ?? "1");

  const data = await getTenantMaintenanceData(
    session.userId,
    session.activeOrgId,
  );
  const currentPage = clampPage(requestedPage, data.totalPages);

  return <MaintenanceWorkspace data={data} currentPage={currentPage} />;
}