import { BellRing as Bell, CircleCheck as CheckCircle2, Clock3, Megaphone } from "@/components/shared/colored-icons";
import { StatCard } from "@/components/theme/ed-dashboard-shell";

type NoticesStatsProps = {
  totalNotifications: number;
  queuedNotifications: number;
  sentNotifications: number;
  totalMoveOutNotices: number;
};

export function NoticesStats({
  totalNotifications,
  queuedNotifications,
  sentNotifications,
  totalMoveOutNotices,
}: NoticesStatsProps) {
  return (
    <section className="workspace-card-grid grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
      <StatCard icon={<Bell className="h-4 w-4" />} label="All Notices" value={totalNotifications} />
      <StatCard icon={<Clock3 className="h-4 w-4" />} label="Queued" value={queuedNotifications} />
      <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Sent" value={sentNotifications} />
      <StatCard icon={<Megaphone className="h-4 w-4" />} label="Given Notices" value={totalMoveOutNotices} />
    </section>
  );
}