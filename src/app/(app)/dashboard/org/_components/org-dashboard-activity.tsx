import Link from "next/link";
import { Clock3 } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import type { OrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { getAuditActivityHref } from "../_lib/activity-links";
import { panelShellClassName } from "./org-dashboard-ui";

function formatAction(action: string) {
  return action.replaceAll("_", " ").toLowerCase();
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function OrgDashboardActivity({ data }: { data: OrgDashboardSummary }) {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recent activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Latest auditable actions across this organization.
            </p>
          </div>
          <Link
            href="/dashboard/org/reports"
            className="text-sm font-medium text-primary transition hover:text-primary/80"
          >
            View reports
          </Link>
        </div>
      </div>

      {data.recentActivity.length === 0 ? (
        <div className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
          No recent audit activity recorded yet.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {data.recentActivity.map((entry) => {
            const href = getAuditActivityHref(entry.entityType, entry.entityId);

            return (
              <li
                key={entry.id}
                className="flex items-start gap-3 px-5 py-4 sm:px-6"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  {href ? (
                    <DeferredLink
                      href={href}
                      className="text-sm font-medium text-foreground transition hover:text-primary"
                    >
                      {formatAction(entry.action)} on {entry.entityType.toLowerCase()}
                    </DeferredLink>
                  ) : (
                    <p className="text-sm font-medium text-foreground">
                      {formatAction(entry.action)} on {entry.entityType.toLowerCase()}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.actorName} · {formatTimestamp(entry.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}