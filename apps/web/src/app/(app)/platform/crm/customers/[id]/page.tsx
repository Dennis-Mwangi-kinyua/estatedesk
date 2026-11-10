import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { CrmShell, Panel, ActivityFeed } from "@/features/crm/ui";
import { activityInclude, platformOwners } from "@/features/crm/queries";
import { CommunicationPanel } from "@/features/crm/communication";
export const dynamic = "force-dynamic";
export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const { id } = await params;
  const [customer, owners] = await Promise.all([prisma.organization.findFirst({ where: { id, deletedAt: null }, include: { subscription: true, marketer: { select: { fullName: true } }, customerActivities: { orderBy: { createdAt: "desc" }, take: 100, include: activityInclude }, salesLeads: { select: { id: true, companyName: true, salesStage: true } } } }), platformOwners()]);
  if (!customer) notFound();
  return <CrmShell platform title={customer.name} description="Customer account and relationship history.">
    <Panel>
      <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{customer.email ?? "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{customer.phone ?? "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Address</dt>
          <dd>{customer.address ?? "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Account</dt>
          <dd>{customer.status}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Subscription</dt>
          <dd>
            {customer.subscription?.plan ?? "No plan"}{" "}·{" "}{customer.subscription?.status ?? "None"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Referral partner</dt>
          <dd>{customer.marketer?.fullName ?? "Direct"}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link className="underline" href={`/platform/organizations/${customer.slug}`}>Manage customer information & subscription</Link>
        <Link className="underline" href={`/platform/messages?q=${encodeURIComponent(customer.name)}`}>Customer inbox</Link>
      </div>
      {customer.salesLeads.map(l => <Link key={l.id} className="mt-3 block text-sm underline" href={`/platform/crm/${l.id}`}>
        {l.companyName}
        {' '}
        ·
        {' '}
        {l.salesStage}
      </Link>)}
    </Panel>
    <CommunicationPanel target="organization" targetId={id} email={customer.email} phone={customer.phone} name={customer.name} />
    <ActivityFeed target="organization" targetId={id} activities={customer.customerActivities} owners={owners} />
  </CrmShell>;
}
