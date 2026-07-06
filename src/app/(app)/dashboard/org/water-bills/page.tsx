import { requireOrgRole } from "@/lib/permissions/guards";
import { WaterBillsWorkspace } from "./_components/water-bills-workspace";
import { getOrgWaterBillsPageData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function OrgWaterBillsPage() {
  const session = await requireOrgRole([
    "ADMIN",
    "MANAGER",
    "OFFICE",
    "ACCOUNTANT",
  ]);
  const data = await getOrgWaterBillsPageData(
    session.activeOrgId!,
    session.activeOrgRole as "ADMIN" | "MANAGER" | "OFFICE" | "ACCOUNTANT",
  );

  return (
    <WaterBillsWorkspace data={data} orgRole={session.activeOrgRole} />
  );
}