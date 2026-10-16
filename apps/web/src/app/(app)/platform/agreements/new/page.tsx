import Link from "@/components/navigation/workspace-link";
import { AgreementPartyFields } from "@/components/service-agreements/agreement-party-fields";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { createAgreementAction } from "@/lib/service-agreements/actions";
import { PageHeader, Surface } from "../../_components/control-plane";
export const dynamic = "force-dynamic";
export default async function NewAgreementPage({ searchParams }: { searchParams: Promise<{orgId?: string; error?: string}> }) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const params = await searchParams;
  const orgs = await prisma.organization.findMany({where:{deletedAt:null},orderBy:{name:"asc"},select:{id:true,name:true}});
  return <div className="engineering-workspace mx-auto w-full min-w-0 max-w-5xl space-y-6">
    <PageHeader eyebrow="Service agreements / New" title="Create a new agreement" description="Prepare an unsigned service agreement and DPA. The organization signs first, then EstateDesk countersigns." action={<Link href="/platform/agreements" className="inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm font-semibold">Back to agreements</Link>} />
    {params.error ? <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-950 dark:bg-red-500/10 dark:text-red-100">Could not create the draft. Check the required fields, organization, contact email, and schedules, then try again.</p> : null}
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
