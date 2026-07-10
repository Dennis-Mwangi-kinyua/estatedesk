import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { ISSUE_LIFECYCLE_STAGES, ISSUE_RAISING_CHANNELS } from "../_lib/constants";
import { panelShellClassName } from "./issues-ui";

export function IssuesGuidance({ orgRole }: { orgRole?: OrgRole | null }) {
  return (
    <aside className="space-y-4">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">How to raise issues</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Maintenance tickets can start from the office desk, tenant dashboard, or
          caretaker follow-up queue.
        </p>

        <div className="mt-4 space-y-3">
          {ISSUE_RAISING_CHANNELS.map((channel) => (
            <div
              key={channel.title}
              className="rounded-2xl border border-border bg-muted/10 p-3"
            >
              <p className="text-sm font-semibold text-foreground">{channel.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {channel.description}
              </p>
              {channel.audience === "office" ? (
                <Link
                  href={channel.href}
                  className="mt-3 inline-flex text-sm font-medium text-primary transition hover:text-primary/80"
                >
                  {channel.actionLabel}
                </Link>
              ) : (
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {channel.actionLabel}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Issue lifecycle</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Every ticket moves through visible stages so nothing disappears in chat.
        </p>

        <ol className="mt-4 space-y-3">
          {ISSUE_LIFECYCLE_STAGES.map((stage, index) => (
            <li
              key={stage.label}
              className="flex gap-3 rounded-2xl border border-border bg-muted/10 p-3"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{stage.label}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {stage.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Need the full guide?</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Read how tenants, caretakers, and office teams keep maintenance visible
          from report to closure.
        </p>
        <div className="mt-4">
          <InAppGuideLink
            topic="issues"
            workspace="org"
            orgRole={orgRole}
            variant="card"
            className="w-full justify-center"
          />
        </div>
      </section>
    </aside>
  );
}