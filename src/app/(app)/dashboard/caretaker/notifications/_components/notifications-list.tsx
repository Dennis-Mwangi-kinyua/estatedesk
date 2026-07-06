import { Bell } from "lucide-react";
import { ListPagination } from "@/app/(app)/dashboard/caretaker/_components/list-pagination";
import { ErrorStateCard } from "@/app/(app)/dashboard/caretaker/issues/_components/issues-ui";
import {
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { buildNotificationsPageHref } from "../_lib/helpers";
import type { CaretakerNotificationsPageData } from "../_lib/types";
import { NotificationCard } from "./notification-card";

export function NotificationsList({
  data,
}: {
  data: CaretakerNotificationsPageData;
}) {
  const {
    notifications,
    totalNotifications,
    currentPage,
    totalPages,
    showingFrom,
    showingTo,
  } = data;

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Inbox"
        title="Your notifications"
        action={
          <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
            {totalNotifications} total
          </span>
        }
      />

      <div className="space-y-3 p-4 sm:p-5">
        {!data.ok ? (
          <ErrorStateCard message={data.errorMessage} />
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              No notifications yet
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              New assignments and process updates will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
            />
          ))
        )}
      </div>

      {data.ok ? (
        <div className="border-t border-border p-4 sm:p-5">
          <ListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            showingFrom={showingFrom}
            showingTo={showingTo}
            totalItems={totalNotifications}
            buildHref={buildNotificationsPageHref}
          />
        </div>
      ) : null}
    </section>
  );
}