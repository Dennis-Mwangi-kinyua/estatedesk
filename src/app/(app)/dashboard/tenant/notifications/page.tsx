import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { NotificationsWorkspace } from "./_components/notifications-workspace";
import { getTenantNotificationsData } from "./_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    filter?: string;
  }>;
};

export default async function TenantNotificationsPage({
  searchParams,
}: PageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const data = await getTenantNotificationsData(
    session.userId,
    session.activeOrgId,
    (await searchParams)?.filter,
  );

  if (!data) {
    return (
      <div className="rounded-[28px] border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Tenant profile not found.
      </div>
    );
  }

  return <NotificationsWorkspace data={data} />;
}