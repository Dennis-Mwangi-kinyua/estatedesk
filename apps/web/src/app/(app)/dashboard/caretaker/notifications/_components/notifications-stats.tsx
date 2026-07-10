import { Bell, Mail } from "lucide-react";
import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerNotificationsPageData } from "../_lib/types";

export function NotificationsStats({
  data,
}: {
  data: Pick<CaretakerNotificationsPageData, "unreadCount" | "totalNotifications">;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <StatCard
        label="Unread"
        value={data.unreadCount}
        note="Notifications awaiting your review"
        icon={Mail}
        highlight={data.unreadCount > 0 ? "warning" : "default"}
      />
      <StatCard
        label="Total"
        value={data.totalNotifications}
        note="All notifications in your inbox"
        icon={Bell}
      />
    </section>
  );
}