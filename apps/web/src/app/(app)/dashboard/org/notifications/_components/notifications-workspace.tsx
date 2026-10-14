import type {
  NotificationFilter,
  PageData,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";
import { DashboardAutoRefresh } from "@/features/dashboard/components/dashboard-auto-refresh";
import { CommunicationFeedPanel } from "@/app/(app)/dashboard/org/notifications/_components/communication-feed-panel";
import { MoveOutQueuePanel } from "@/app/(app)/dashboard/org/notifications/_components/move-out-queue-panel";
import { NotificationsHero } from "@/app/(app)/dashboard/org/notifications/_components/notifications-hero";
import { OperationsAlertsSection } from "@/app/(app)/dashboard/org/notifications/_components/operations-alerts-section";
import { OperationsSidebar } from "@/app/(app)/dashboard/org/notifications/_components/operations-sidebar";
import { WaterApprovalQueuePanel } from "@/app/(app)/dashboard/org/notifications/_components/water-approval-queue-panel";

type NotificationsWorkspaceProps = {
  activeFilter: NotificationFilter;
  data: PageData;
};

export function NotificationsWorkspace({
  activeFilter,
  data,
}: NotificationsWorkspaceProps) {
  const {
    membership,
    approvalQueue,
    approvalQueueCount,
    moveOutQueue,
    notifications,
    recentPayments,
    metrics: { totalNotifications, unreadCount, queuedCount, sentCount, failedCount },
  } = data;

  return (
    <div className="org-theme-content notifications-page uniform-page-actions mx-auto w-full min-w-0 max-w-7xl space-y-5 px-0 pb-24 pt-2 sm:px-2">
      <DashboardAutoRefresh interval={60_000} />
      <NotificationsHero
        membership={membership}
        approvalQueueCount={approvalQueueCount}
        moveOutCount={moveOutQueue.length}
        unreadCount={unreadCount}
        queuedCount={queuedCount}
        sentCount={sentCount}
      />

      <CommunicationFeedPanel membership={membership} notifications={notifications}
        activeFilter={activeFilter} totalNotifications={totalNotifications}
        unreadCount={unreadCount} queuedCount={queuedCount} failedCount={failedCount} />
      <section aria-label="Approvals and move-outs" className="grid min-w-0 items-start gap-5">
        <MoveOutQueuePanel membership={membership} moveOutQueue={moveOutQueue} />
        <WaterApprovalQueuePanel membership={membership} approvalQueue={approvalQueue} approvalQueueCount={approvalQueueCount} />
      </section>
      <OperationsSidebar membership={membership} approvalQueueCount={approvalQueueCount}
        recentPayments={recentPayments} sentCount={sentCount} failedCount={failedCount} unreadCount={unreadCount} />
      <OperationsAlertsSection />
    </div>
  );
}
