import { requireUserSession } from "@/lib/auth/session";
import { getPagination } from "@/lib/db/pagination";
import { StaffWorkspace } from "./_components/staff-workspace";
import { getStaffDirectoryData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ page?: string; pageSize?: string }> }) {
  const session = await requireUserSession();
  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
        No active organisation found for your account.
      </div>
    );
  }
  const params = await searchParams;
  const { page, pageSize, skip, take } = getPagination({ page: Number(params.page ?? 1), pageSize: Number(params.pageSize ?? 20) });
  const data = await getStaffDirectoryData({ orgId: session.activeOrgId, skip, take, page, pageSize });
  return <StaffWorkspace data={data} orgRole={session.activeOrgRole} />;
}
