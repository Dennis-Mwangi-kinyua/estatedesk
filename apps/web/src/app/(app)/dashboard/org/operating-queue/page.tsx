import Link from "@/components/navigation/workspace-link";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { getOperatingQueue } from "@/lib/workflow/operating-queue";
import { OperatingQueue } from "../_components/operating-queue";
import { queueNoticeText } from "../_components/queue-row-action";

export const dynamic = "force-dynamic";

export default async function OperatingQueuePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const query = await searchParams;
  const notice = queueNoticeText(query.notice);
  const session = await requireManagementAccess();
  if (!session.activeOrgId) throw new Error("Missing active organization id in session");
  if (session.membershipScope && session.membershipScope.scopeType !== "ORG") {
    return <main className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6"><h1 className="text-2xl font-semibold">Work queue</h1><p className="text-sm text-muted-foreground">This queue is for organisation-wide roles. Your assigned units stay in the unit list.</p><Link className="inline-flex min-h-11 items-center font-semibold underline" href="/dashboard/org/units">Open assigned units</Link></main>;
  }
  const organization = await prisma.organization.findUnique({ where: { id: session.activeOrgId }, select: { currencyCode: true, name: true } });
  const groups = await getOperatingQueue(session.activeOrgId, organization?.currencyCode ?? "KES");
  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 pb-12 sm:p-6">
      <header>
        <p className="text-sm text-muted-foreground">{organization?.name}</p>
        <h1 className="text-2xl font-semibold">Work queue</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">The same records open from the dashboard, this page, and the mobile work queue. Each row is the tenant, unit, amount, and the one next action.</p>
      </header>
      {notice ? <p role="status" className="rounded-xl border border-border bg-card px-4 py-3 text-sm">{notice}</p> : null}
      <OperatingQueue groups={groups} returnPath="/dashboard/org/operating-queue" />
    </main>
  );
}
