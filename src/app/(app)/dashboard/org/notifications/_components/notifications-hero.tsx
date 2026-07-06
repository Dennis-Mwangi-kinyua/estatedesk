import Link from "next/link";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  ArrowLeft,
  Bell,
  Clock3,
  Droplets,
  Megaphone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { sendPaymentRemindersAction } from "@/app/(app)/dashboard/org/notifications/actions";
import { OPERATIONS_WORKFLOW_STEPS } from "@/app/(app)/dashboard/org/notifications/_lib/constants";
import type { OrgContext } from "@/app/(app)/dashboard/org/notifications/_lib/types";
import { KpiTile } from "@/app/(app)/dashboard/org/notifications/_components/notifications-ui";

type NotificationsHeroProps = {
  membership: OrgContext;
  approvalQueueCount: number;
  moveOutCount: number;
  unreadCount: number;
  queuedCount: number;
  sentCount: number;
};

export function NotificationsHero({
  membership,
  approvalQueueCount,
  moveOutCount,
  unreadCount,
  queuedCount,
  sentCount,
}: NotificationsHeroProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              {membership.org.name} operations desk
            </div>

            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Operations overview
            </h1>

            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              A single workspace for water approvals, payment signals, and outbound
              communication across the organization.
            </p>

            <InAppGuideHint topic="water" workspace="org" orgRole={membership.role} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <div className="rounded-2xl border border-border bg-muted/15 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Organization time
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {membership.org.timezone}
              </p>
            </div>
            <Link
              href="/dashboard/org"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <form action={sendPaymentRemindersAction}>
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
                Send reminders
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-border px-5 py-5 sm:grid-cols-3 sm:px-6 xl:grid-cols-5">
        <KpiTile label="Water review" value={approvalQueueCount} icon={Droplets} />
        <KpiTile label="Move-outs" value={moveOutCount} icon={Megaphone} />
        <KpiTile label="Unread" value={unreadCount} icon={Bell} />
        <KpiTile label="Queued" value={queuedCount} icon={Clock3} />
        <KpiTile label="Sent" value={sentCount} icon={Send} />
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-6">
        {OPERATIONS_WORKFLOW_STEPS.map((item) => (
          <div
            key={item.step}
            className="rounded-2xl border border-border bg-muted/15 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {item.step}
              </span>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}