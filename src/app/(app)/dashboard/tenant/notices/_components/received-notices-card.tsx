import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { formatDateTime } from "@/lib/formatters";
import type { TenantNoticesResult } from "@/app/(app)/dashboard/tenant/notices/_lib/queries";
import { getNotificationStatusClasses } from "@/app/(app)/dashboard/tenant/notices/_lib/helpers";
import { EmptySection } from "@/app/(app)/dashboard/tenant/notices/_components/empty-section";

type ReceivedNoticesCardProps = {
  notifications: TenantNoticesResult["notifications"];
};

export function ReceivedNoticesCard({ notifications }: ReceivedNoticesCardProps) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
          Received Notices
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Notifications sent to your tenant account. Notifications belong directly
          to the tenant in your schema.
        </p>
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-[20px] ed-theme-card border border-border bg-muted/35 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {notification.type.replaceAll("_", " ")} •{" "}
                    {notification.channel.replaceAll("_", " ")}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getNotificationStatusClasses(
                    notification.status,
                  )}`}
                >
                  {notification.status}
                </span>
              </div>

              <div className="mt-3 rounded-[16px] border border-border/60 bg-card px-3 py-3">
                <p className="text-sm text-foreground/80">{notification.message}</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Created
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>

                <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Read
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatDateTime(notification.readAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptySection
            title="No received notices"
            description="You do not have any tenant notifications yet."
            guideTopic="rent"
          />
        )}
      </div>
    </SurfaceCard>
  );
}