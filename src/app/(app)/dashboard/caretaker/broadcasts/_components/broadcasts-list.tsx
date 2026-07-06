import { Megaphone } from "lucide-react";
import { ErrorStateCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { markCaretakerBroadcastReadAction } from "../actions";
import { formatDateTime } from "../_lib/helpers";
import type { CaretakerBroadcastsPageData } from "../_lib/types";

export function BroadcastsList({
  data,
}: {
  data: CaretakerBroadcastsPageData;
}) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro eyebrow="Inbox" title="Office broadcasts" />
      <div className={`space-y-3 ${panelBodyClassName} pt-0`}>
        {!data.ok ? (
          <ErrorStateCard message={data.errorMessage} />
        ) : data.broadcasts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              No broadcasts yet
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Office announcements will appear here when sent.
            </p>
          </div>
        ) : (
          data.broadcasts.map((broadcast) => {
            const isUnread = !broadcast.readAt;

            return (
              <article
                key={broadcast.id}
                className={`rounded-2xl border border-border bg-card p-4 ${
                  isUnread ? "shadow-sm" : "opacity-85"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {broadcast.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {broadcast.message}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(broadcast.createdAt)}
                    </p>
                  </div>
                  {isUnread ? (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </div>

                {isUnread ? (
                  <form action={markCaretakerBroadcastReadAction} className="mt-3">
                    <input
                      type="hidden"
                      name="notificationId"
                      value={broadcast.id}
                    />
                    <button
                      type="submit"
                      className="inline-flex rounded-2xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/30"
                    >
                      Mark as read
                    </button>
                  </form>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}