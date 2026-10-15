import Link from "@/components/navigation/workspace-link";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { AGREEMENT_ENTITY } from "@/lib/service-agreements/contract";
import { createAgreementAction } from "@/lib/service-agreements/actions";
import { Badge, PageHeader, Surface, formatDateTime } from "../_components/control-plane";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{orgId?: string; error?: string}> }) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const params = await searchParams;
  const [orgs, documents] = await Promise.all([
    prisma.organization.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true }, take: 500 }),
    prisma.documentRecord.findMany({ where: { entityType: AGREEMENT_ENTITY, ...(params.orgId ? {orgId: params.orgId} : {}) }, orderBy: { createdAt: "desc" }, take: 50, include: { org: { select: { name: true } } } }),
  ]);
  return <div className="engineering-workspace mx-auto min-w-0 w-full max-w-7xl space-y-6">
    <PageHeader eyebrow="Platform administration" title="Service agreements" description="Prepare an organization-specific service agreement and DPA, sign for EstateDesk, then send it to the organization's administrators for countersignature." />
    {params.error ? <p role="alert" className="rounded-xl border p-4 text-sm">Could not create the draft. Check all required fields, contact email, organization, and schedule lengths, then try again.</p> : null}
    <Surface title="Recent agreements" description="Latest 50 agreements. Drafts are private to platform administrators; organizations see agreements only after EstateDesk signs and sends them."><div className="engineering-record-grid">{documents.map(doc => <Link key={doc.id} href={`/platform/agreements/${doc.id}`} className="space-y-3 rounded-xl border border-border p-5"><Badge>{doc.status === "ISSUED" ? "AWAITING COUNTERSIGNATURE" : doc.status}</Badge><h2 className="text-base font-semibold">{doc.org.name}</h2><p className="text-sm text-muted-foreground">{formatDateTime(doc.createdAt)}</p><p className="text-sm font-semibold">Review agreement →</p></Link>)}{!documents.length ? <p className="text-sm text-muted-foreground">No agreements yet. Create an unsigned draft below.</p> : null}</div></Surface>
    <Surface title="Prepare organization agreement" description="Enter the parties’ legal names and accurate customer-specific schedules. Review the generated draft before signing; no agreement is sent at this step.">
      <form action={createAgreementAction} className="space-y-5 p-5">
        <div className="engineering-summary-grid grid gap-4">
          <div className="space-y-2 text-sm"><label htmlFor="agreement-organization" className="block">Organization</label><select id="agreement-organization" name="orgId" required defaultValue={params.orgId ?? ""} className="w-full rounded-xl border p-3"><option value="" disabled>Select organization</option>{orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></div>
          <Field name="customer" label="Customer's full legal name" />
          <Field name="provider" label="EstateDesk contracting legal entity" defaultValue="Afrisilicon Technology Limited, trading as EstateDesk" />
          <Field name="contact" label="EstateDesk privacy and incident contact email" type="email" />
          <Field name="representative" label="EstateDesk representative preparing the agreement" defaultValue={session.fullName} />
        </div>
        <Schedule name="services" label="Service and commercial schedule" placeholder="Services and scope, plan and fees, start date, duration, support contact, termination notice, and customer responsibilities." />
        <Schedule name="infrastructure" label="Subprocessors, hosting locations, and safeguards" placeholder="List actual providers, purposes, countries, authorization and transfer safeguards, access controls, security measures, and backup arrangements. Do not include passwords or keys." />
        <Schedule name="retention" label="Retention and exit schedule" placeholder="Data categories and retention periods; export and deletion window; backup expiry; legal holds; who handles exit requests." />
        <p className="text-sm leading-6 text-muted-foreground">This draft uses a Kenyan-law template and needs review for the parties’ circumstances before signing. It does not certify legal compliance or infrastructure safeguards.</p>
        <button className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Create unsigned draft</button>
      </form>
    </Surface>
  </div>;
}
function Field({ name, label, defaultValue, type = "text" }: {name: string; label: string; defaultValue?: string; type?: string}) { return <label className="block space-y-2 text-sm"><span>{label}</span><input name={name} type={type} required minLength={2} maxLength={240} defaultValue={defaultValue} className="w-full rounded-xl border p-3" /></label>; }
function Schedule({name, label, placeholder}: {name: string; label: string; placeholder: string}) {return <label className="block space-y-2 text-sm"><span>{label}</span><textarea name={name} required minLength={20} maxLength={8000} rows={4} placeholder={placeholder} className="w-full rounded-xl border p-3 text-sm leading-6" /></label>;}
