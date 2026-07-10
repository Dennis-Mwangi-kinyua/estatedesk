import { ReactNode } from "react";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { CaretakerDashboardShell } from "@/components/layout/caretaker-dashboard-shell";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { SubscriptionWarning } from "@/components/billing/subscription-warning";
import { UnreadNotificationAlertsPanel } from "@/components/notifications/unread-notification-alerts-panel";

type CaretakerLayoutProps = {
  children: ReactNode;
};

export default async function CaretakerLayout({
  children,
}: CaretakerLayoutProps) {
  const session = await requireCaretakerAccess();
  const access = await requireActiveSubscription(session.activeOrgId!);

  return (
    <CaretakerDashboardShell fullName={session.fullName}>
      <SubscriptionWarning access={access} />
      <UnreadNotificationAlertsPanel
        audience="caretaker"
        orgId={session.activeOrgId!}
        userId={session.userId}
      />
      {children}
    </CaretakerDashboardShell>
  );
}
