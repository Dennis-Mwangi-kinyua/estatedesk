import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerNotificationsPageData } from "../_lib/types";
import { NotificationsHeader } from "./notifications-header";
import { NotificationsList } from "./notifications-list";
import { NotificationsSidebar } from "./notifications-sidebar";
import { NotificationsStats } from "./notifications-stats";

export function NotificationsWorkspace({
  data,
}: {
  data: CaretakerNotificationsPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <NotificationsHeader data={data} />
      <NotificationsStats data={data} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <NotificationsList data={data} />
        <NotificationsSidebar />
      </div>

      <CaretakerWorkspaceFooter note="Operational updates for caretakers in the field" />
    </div>
  );
}