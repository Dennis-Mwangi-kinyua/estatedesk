import { requireOrgCrmAccess } from "@/features/crm/access";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

import { CrmShell, Panel, ActivityFeed } from "@/features/crm/ui";
import { tenantCrmWhere } from "@/features/crm/policy";
import { activityInclude, orgOwners } from "@/features/crm/queries";
import { CommunicationPanel } from "@/features/crm/communication";
export const dynamic = "force-dynamic";
export default async function TenantCrmPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgCrmAccess(); const { id } = await params; const orgId = session.activeOrgId!;
  const [customer, owners] = await Promise.all([prisma.tenant.findFirst({ where: { ...tenantCrmWhere(orgId, session.membershipScope), id }, include: { crmActivities: { where: { scopeOrgId: orgId }, orderBy: { createdAt: "desc" }, take: 100, include: activityInclude } } }), orgOwners(orgId)]);
  if (!customer) notFound();
  return <CrmShell title={customer.fullName} description="Customer information, communication, and relationship history.">
    <Panel>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{customer.email ?? "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{customer.phone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd>{customer.status}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Company</dt>
          <dd>{customer.companyName ?? "Individual customer"}</dd>
        </div>
      </dl>
      {customer.notes && <p className="mt-4 whitespace-pre-wrap text-sm">{customer.notes}</p>}
      <Link href={`/dashboard/org/tenants/${customer.slug ?? customer.id}`} className="mt-4 inline-block text-sm underline">Manage customer information, leases & payments</Link>
    </Panel>
    <CommunicationPanel target="tenant" targetId={id} email={customer.email} phone={customer.phone} name={customer.fullName} />
    <ActivityFeed target="tenant" targetId={id} activities={customer.crmActivities} owners={owners} />
  </CrmShell>;
}
