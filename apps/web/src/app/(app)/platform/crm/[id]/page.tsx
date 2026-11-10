import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { CrmShell, Panel, Field, ActivityFeed, inputClass } from "@/features/crm/ui";
import { CrmForm, DateField } from "@/features/crm/form";
import { updateSalesLead, updateLeadContact } from "@/features/crm/actions";
import { stages, label } from "@/features/crm/policy";
import { activityInclude, platformOwners } from "@/features/crm/queries";

import { OrganizationPicker } from "@/features/crm/organization-picker";
import { CommunicationPanel } from "@/features/crm/communication";

export const dynamic = "force-dynamic";
export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const { id } = await params;
  const [lead, owners] = await Promise.all([
    prisma.onboardingRequest.findUnique({ where: { id }, include: { marketer: { select: { fullName: true } }, customerOrg: { include: { subscription: true } }, crmActivities: { orderBy: { createdAt: "desc" }, take: 100, include: activityInclude } } }), platformOwners(),
  ]);
  if (!lead) notFound();
  return <CrmShell platform title={lead.companyName} description={`${lead.fullName} · ${lead.workEmail}`}>
    {lead.source === "DEMO_REQUEST" && <Panel><p className="text-xs font-bold uppercase tracking-widest text-primary">Demo requested</p><h2 className="mt-2 text-xl font-semibold">Guide this client from demo to trial</h2><ol className="mt-3 space-y-2 text-sm"><li>1. Assign a sales owner and agree a 30–45 minute demo using sample data.</li><li>2. Schedule the appointment below; EstateDesk creates its follow-up task.</li><li>3. When the client is ready, qualify their onboarding request and create a Pro or Plus workspace for a 14-day trial.</li></ol><Link href="/platform/onboarding" className="mt-4 inline-flex min-h-11 items-center font-semibold underline">Review onboarding and open workspace</Link></Panel>}
    <Panel>
      <div className="flex flex-wrap gap-4 text-sm">
        <a href={`mailto:${lead.workEmail}`} className="underline">Email contact</a>
        {lead.phone && <a href={`tel:${lead.phone}`} className="underline">{lead.phone}</a>}
        <span>Source:{" "}{lead.source}
        </span>
        {lead.marketer && <span>Referral partner:{" "}{lead.marketer.fullName}
        </span>}
      </div>
      {lead.message && <p className="mt-4 whitespace-pre-wrap text-sm">{lead.message}</p>}
      {lead.customerOrg && <div className="mt-4 rounded-xl bg-muted p-4 text-sm">
        <Link className="font-semibold underline" href={`/platform/crm/customers/${lead.customerOrg.id}`}>{lead.customerOrg.name}</Link>
        <p className="mt-2">Subscription:{" "}{lead.customerOrg.subscription?.plan ?? "No plan"}{" "}·{" "}{lead.customerOrg.subscription?.status ?? "No subscription"}
        </p>
        <Link className="mt-2 inline-block underline" href={`/platform/organizations/${lead.customerOrg.slug}`}>Open organization & billing</Link>
      </div>}
    </Panel>
    <Panel>
      <details>
        <summary className="cursor-pointer font-semibold">Edit prospect contact information</summary>
        <CrmForm key={lead.updatedAt.toISOString()} action={updateLeadContact} submit="Save contact" className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="leadId" value={id} />
          <input type="hidden" name="updatedAt" value={lead.updatedAt.toISOString()} />
          <Field title="Organization name"><input name="companyName" required maxLength={160} defaultValue={lead.companyName} className={inputClass} /></Field>
          <Field title="Contact name"><input name="fullName" required maxLength={120} defaultValue={lead.fullName} className={inputClass} /></Field>
          <Field title="Work email"><input name="workEmail" type="email" required maxLength={160} defaultValue={lead.workEmail} className={inputClass} /></Field>
          <Field title="Phone"><input name="phone" maxLength={40} defaultValue={lead.phone ?? ""} className={inputClass} /></Field>
          <Field title="Portfolio type"><input name="managedPropertyType" required maxLength={100} defaultValue={lead.managedPropertyType} className={inputClass} /></Field>
          <Field title="Initial enquiry"><textarea name="message" maxLength={4000} defaultValue={lead.message ?? ""} className={inputClass} /></Field>
        </CrmForm>
      </details>
    </Panel>
    <Panel>
      <h2 className="mb-4 text-lg font-semibold">Deal details</h2>
      <CrmForm key={lead.updatedAt.toISOString()} action={updateSalesLead} submit="Save deal" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <input type="hidden" name="leadId" value={id} />
        <input type="hidden" name="updatedAt" value={lead.updatedAt.toISOString()} />
        <Field title="Stage"><select name="salesStage" defaultValue={lead.salesStage} className={inputClass}>{stages.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
        <Field title="Sales owner">
          <select name="salesOwnerId" defaultValue={lead.salesOwnerId ?? ""} className={inputClass}>
            <option value="">Unassigned</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}
          </select>
        </Field>
        <Field title="Target plan"><input name="targetPlan" maxLength={80} defaultValue={lead.targetPlan ?? ""} placeholder="Pro, Plus, Custom…" className={inputClass} /></Field>
        <Field title="Expected monthly value"><input name="expectedMonthlyValue" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={lead.expectedMonthlyValue?.toString() ?? ""} className={inputClass} /></Field>
        <Field title="Currency (ISO code)"><input name="currencyCode" required pattern="[A-Z]{3}" maxLength={3} defaultValue={lead.currencyCode} className={inputClass} /></Field>
        <Field title="Demo appointment (East Africa Time)"><DateField name="demoAt" initial={lead.demoAt?.toISOString()} /></Field>
        <OrganizationPicker initial={lead.customerOrg ? { id: lead.customerOrg.id, name: lead.customerOrg.name, email: lead.customerOrg.email } : null} />
        <Field title="Lost reason"><textarea name="lostReason" maxLength={1000} defaultValue={lead.lostReason ?? ""} className={inputClass} /></Field>
        <p className="text-xs text-muted-foreground">A won deal requires a linked organization. Subscription changes are managed through organization billing.</p>
      </CrmForm>
    </Panel>
    <CommunicationPanel target="lead" targetId={id} email={lead.workEmail} phone={lead.phone} name={lead.fullName} />
    <ActivityFeed target="lead" targetId={id} activities={lead.crmActivities} owners={owners} />
  </CrmShell>;
}
