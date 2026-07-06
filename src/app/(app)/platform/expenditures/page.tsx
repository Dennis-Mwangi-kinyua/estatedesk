import { requirePlatformRole } from "@/lib/permissions/guards";
import { ExpendituresWorkspace } from "./_components/expenditures-workspace";
import { getPlatformExpendituresPageData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function PlatformExpendituresPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);

  const data = await getPlatformExpendituresPageData();
  const defaultDate = new Date().toISOString().slice(0, 10);

  return <ExpendituresWorkspace data={data} defaultDate={defaultDate} />;
}