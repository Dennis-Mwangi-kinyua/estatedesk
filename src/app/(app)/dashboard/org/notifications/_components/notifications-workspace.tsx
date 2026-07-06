import type {
  NotificationFilter,
  PageData,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";
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
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <NotificationsHero
        membership={membership}
        approvalQueueCount={approvalQueueCount}
        moveOutCount={moveOutQueue.length}
        unreadCount={unreadCount}
        queuedCount={queuedCount}
        sentCount={sentCount}
      />

      <OperationsAlertsSection />

      <section className="grid gap-5 xl:grid-cols-2">
        <MoveOutQueuePanel membership={membership} moveOutQueue={moveOutQueue} />
        <WaterApprovalQueuePanel
          membership={membership}
          approvalQueue={approvalQueue}
          approvalQueueCount={approvalQueueCount}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <CommunicationFeedPanel
            membership={membership}
            notifications={notifications}
            activeFilter={activeFilter}
            totalNotifications={totalNotifications}
            unreadCount={unreadCount}
            queuedCount={queuedCount}
            failedCount={failedCount}
          />
        </div>

        <OperationsSidebar
          membership={membership}
          approvalQueueCount={approvalQueueCount}
          recentPayments={recentPayments}
          sentCount={sentCount}
          failedCount={failedCount}
          unreadCount={unreadCount}
        />
      </section>
    </div>
  );
}