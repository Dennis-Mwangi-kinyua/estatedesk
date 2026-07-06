import { formatMessageDate } from "../_lib/helpers";
import type { SupportPageData } from "../_lib/types";
import { SupportEmptyState } from "./support-empty-state";
import { MessageStatusPill, panelShellClassName } from "./support-ui";

export function SupportMessagesSection({ data }: { data: SupportPageData }) {
  const { messages } = data;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-foreground">Recent messages</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your last 20 requests to platform support.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        {messages.length === 0 ? (
          <SupportEmptyState />
        ) : (
          <div className="space-y-3">
            {messages.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border bg-muted/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{item.subject}</p>
                  <MessageStatusPill status={item.status} />
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {item.message}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {formatMessageDate(item.createdAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}