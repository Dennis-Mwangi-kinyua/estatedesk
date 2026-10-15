import { AgreementPartyFields } from "@/components/service-agreements/agreement-party-fields";
import Link from "@/components/navigation/workspace-link";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { agreementData, AGREEMENT_ENTITY } from "@/lib/service-agreements/contract";
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
    <PageHeader eyebrow="Platform administration" title="Service agreements" description="Prepare an organization-specific service agreement and DPA, send it to the organization to sign first, then countersign for EstateDesk to release downloads for both parties." />
    {params.error ? <p role="alert" className="rounded-xl border p-4 text-sm">Could not create the draft. Check all required fields, contact email, organization, and schedule lengths, then try again.</p> : null}
    <Surface title="Recent agreements" description="Latest 50 agreements. Drafts are private to platform administrators. Send an agreement for the organization to sign first."><div className="engineering-record-grid">{documents.map(doc => <Link key={doc.id} href={`/platform/agreements/${doc.id}`} className="space-y-3 rounded-xl border border-border p-5"><Badge>{doc.status === "ISSUED" ? agreementData(doc.metadata).organizationSignature ? "AWAITING PLATFORM SIGNATURE" : "AWAITING ORGANIZATION SIGNATURE" : doc.status}</Badge><h2 className="text-base font-semibold">{doc.org.name}</h2><p className="text-sm text-muted-foreground">{formatDateTime(doc.createdAt)}</p><p className="text-sm font-semibold">Review agreement →</p></Link>)}{!documents.length ? <p className="text-sm text-muted-foreground">No agreements yet. Create an unsigned draft below.</p> : null}</div></Surface>
    <Surface title="Prepare organization agreement" description="Organization details and draft schedules are prefilled. Confirm the legal name and complete customer-specific commercial and infrastructure details. Review the generated draft before signing; no agreement is sent at this step.">
      <form action={createAgreementAction} className="space-y-5 p-5">
        <div className="engineering-summary-grid grid gap-4">
          <AgreementPartyFields organizations={orgs} initialOrgId={params.orgId} />
          <Field name="provider" label="EstateDesk contracting legal entity" defaultValue="Afrisilicon Technology Limited, trading as EstateDesk" />
          <Field name="contact" label="EstateDesk privacy and incident contact email" type="email" defaultValue={process.env.ESTATEDESK_PRIVACY_EMAIL ?? session.email ?? ""} />
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
function Schedule({name, label, placeholder}: {name: string; label: string; placeholder: string}) {return <label className="block space-y-2 text-sm"><span>{label}</span><textarea name={name} required minLength={20} maxLength={8000} rows={4} placeholder={placeholder} defaultValue={name === "services" ? "EstateDesk property-management services for the selected organization, covering its configured portfolio, occupancy, billing, payments, documents and reporting. Fees, subscription term and support follow the organization’s agreed subscription schedule; confirm these details before sending." : name === "infrastructure" ? "Processing is limited to providing the organization’s configured EstateDesk services. Access is restricted to authorized accounts. Confirm and record the current hosting providers, countries, subprocessors, transfer safeguards and backup arrangements before sending." : "Retention follows the organization’s configured retention policy and applicable recordkeeping requirements. Confirm data-category periods, the export and deletion window, backup expiry, legal holds and the exit contact before sending."} className="w-full rounded-xl border p-3 text-sm leading-6" /></label>;}
