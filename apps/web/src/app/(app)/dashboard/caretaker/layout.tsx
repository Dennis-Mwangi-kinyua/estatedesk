import { ProductUpdatesBanner } from "@/features/updates/banner";
import { getCaretakerUnitHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceAccessProvider } from "@/components/navigation/workspace-link";
import { getCaretakerWorkspaceScope } from "@/lib/caretaker/workspace-scope";
import { caretakerCanAccessPath } from "@/lib/caretaker/workspace-policy";
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
  const scope = await getCaretakerWorkspaceScope(session.activeOrgId!, session.userId, session.membershipScope?.scopeType, session.membershipScope?.scopeId);
  const pathname = (await headers()).get("x-estatedesk-pathname");
  if (pathname && !caretakerCanAccessPath(pathname, scope.sections)) redirect("/dashboard/caretaker");

  return (
    <WorkspaceAccessProvider access={{ platformRole: session.platformRole, activeOrgRole: session.activeOrgRole, activeOrgId: session.activeOrgId, grantedPermissions: session.grantedPermissions, caretakerSections: scope.sections, caretakerUnitPaths: scope.unitIds.map(getCaretakerUnitHref) }}>
    <CaretakerDashboardShell fullName={session.fullName}>
      <SubscriptionWarning access={access} />
      <UnreadNotificationAlertsPanel
        audience="caretaker"
        orgId={session.activeOrgId!}
        userId={session.userId}
      />
      <ProductUpdatesBanner userId={session.userId} audience={"CARETAKER"} />
      {children}
    </CaretakerDashboardShell>
    </WorkspaceAccessProvider>
  );
}
