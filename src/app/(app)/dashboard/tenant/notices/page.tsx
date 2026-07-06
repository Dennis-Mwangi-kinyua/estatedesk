import { PageShell, SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import {
  getErrorMessage,
  getSuccessMessage,
} from "@/app/(app)/dashboard/tenant/notices/_lib/helpers";
import { getTenantNoticesData } from "@/app/(app)/dashboard/tenant/notices/_lib/queries";
import type { TenantNoticesPageProps } from "@/app/(app)/dashboard/tenant/notices/_lib/types";
import { FlashMessages } from "@/app/(app)/dashboard/tenant/notices/_components/flash-messages";
import { GivenNoticesCard } from "@/app/(app)/dashboard/tenant/notices/_components/given-notices-card";
import { GiveNoticeCard } from "@/app/(app)/dashboard/tenant/notices/_components/give-notice-card";
import { NoticesHeader } from "@/app/(app)/dashboard/tenant/notices/_components/notices-header";
import { NoticesStats } from "@/app/(app)/dashboard/tenant/notices/_components/notices-stats";
import { ReceivedNoticesCard } from "@/app/(app)/dashboard/tenant/notices/_components/received-notices-card";

export default async function TenantNoticesPage({
  searchParams,
}: TenantNoticesPageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const errorMessage = getErrorMessage(resolvedSearchParams.error);
  const successMessage = getSuccessMessage(resolvedSearchParams.success);

  const tenant = await getTenantNoticesData(session.userId, session.activeOrgId);

  if (!tenant) {
    return (
      <PageShell>
        <SurfaceCard className="p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Notices
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tenant profile not found.
          </p>
        </SurfaceCard>
      </PageShell>
    );
  }

  const activeLease = tenant.leases[0] ?? null;
  const notifications = tenant.notifications;
  const moveOutNotices = tenant.moveOutNotices;

  const queuedNotifications = notifications.filter(
    (notification) => notification.status === "QUEUED",
  ).length;
  const sentNotifications = notifications.filter(
    (notification) => notification.status === "SENT",
  ).length;
  const activeMoveOutNotices = moveOutNotices.filter((notice) =>
    ["SUBMITTED", "INSPECTION_SCHEDULED", "INSPECTION_COMPLETED"].includes(
      notice.status,
    ),
  ).length;
  const closedMoveOutNotices = moveOutNotices.filter((notice) =>
    ["CLOSED", "CANCELLED"].includes(notice.status),
  ).length;

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <NoticesHeader activeUnit={activeLease?.unit ?? null} />
        <FlashMessages
          successMessage={successMessage}
          errorMessage={errorMessage}
        />
        <NoticesStats
          totalNotifications={notifications.length}
          queuedNotifications={queuedNotifications}
          sentNotifications={sentNotifications}
          totalMoveOutNotices={moveOutNotices.length}
        />

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <ReceivedNoticesCard notifications={notifications} />
          <div className="space-y-4">
            <GiveNoticeCard hasActiveLease={Boolean(activeLease)} />
            <GivenNoticesCard
              moveOutNotices={moveOutNotices}
              activeMoveOutNotices={activeMoveOutNotices}
              closedMoveOutNotices={closedMoveOutNotices}
            />
          </div>
        </section>
      </div>
    </PageShell>
  );
}