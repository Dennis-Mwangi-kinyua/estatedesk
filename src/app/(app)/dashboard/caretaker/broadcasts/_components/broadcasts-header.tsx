import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerBroadcastsPageData } from "../_lib/types";

export function BroadcastsHeader({
  data,
}: {
  data: CaretakerBroadcastsPageData;
}) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <p className="text-sm text-muted-foreground">Office messages</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Broadcasts
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          General announcements and operational updates sent to caretakers by
          office staff.
        </p>
        {data.ok ? (
          <p className="mt-4 text-sm font-medium text-foreground">
            {data.unreadCount} unread · {data.totalBroadcasts} total
          </p>
        ) : null}
      </div>
    </section>
  );
}