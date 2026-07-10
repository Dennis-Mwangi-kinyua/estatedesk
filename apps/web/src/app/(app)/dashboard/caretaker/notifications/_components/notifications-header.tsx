import { Bell, CheckCircle2 } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { markAllCaretakerNotificationsReadAction } from "../actions";
import type { CaretakerNotificationsPageData } from "../_lib/types";

export function NotificationsHeader({
  data,
}: {
  data: Pick<CaretakerNotificationsPageData, "unreadCount">;
}) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              Field operations
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Notifications
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {data.unreadCount > 0
                ? `${data.unreadCount} unread notification${data.unreadCount === 1 ? "" : "s"} across assignments, issues, inspections, and billing.`
                : "Assignment, issue, inspection, payment, and operational updates sent to you in EstateDesk."}
            </p>

            <InAppGuideHint topic="caretaker" workspace="caretaker" />
          </div>

          {data.unreadCount > 0 ? (
            <form action={markAllCaretakerNotificationsReadAction}>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
              >
                <CheckCircle2 className="h-4 w-4" />
                Read all
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}