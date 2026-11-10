import Link from "next/link";
import type { Prisma, SalesStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { CrmShell, Panel, Field, inputClass, dateText } from "@/features/crm/ui";
import { CrmForm } from "@/features/crm/form";
import { createSalesLead } from "@/features/crm/actions";
import { stages, label } from "@/features/crm/policy";
import { pageNumber, platformOwners } from "@/features/crm/queries";

export const dynamic = "force-dynamic";
export default async function SalesCrmPage({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string; owner?: string; page?: string; due?: string; source?: string }> }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const params = await searchParams; const q = (params.q ?? "").trim().slice(0, 160); const page = pageNumber(params.page);
  const stage = stages.includes(params.stage as SalesStage) ? params.stage as SalesStage : undefined;
  const where: Prisma.OnboardingRequestWhereInput = {
    ...(q ? { OR: ["companyName", "fullName", "workEmail"].map(key => ({ [key]: { contains: q, mode: "insensitive" } })) } : {}),
    ...(params.source === "demo" ? { source: "DEMO_REQUEST" } : {}),
    ...(stage ? { salesStage: stage } : {}), ...(params.owner === "unassigned" ? { salesOwnerId: null } : params.owner ? { salesOwnerId: params.owner } : {}),
    ...(params.due === "overdue" ? { crmActivities: { some: { completedAt: null, dueAt: { lt: new Date() } } } } : {}),
  };
  const [leads, total, counts, owners, overdue, values] = await Promise.all([
    prisma.onboardingRequest.findMany({ where, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: 25, skip: (page - 1) * 25, include: { salesOwner: { select: { fullName: true } }, crmActivities: { where: { completedAt: null, dueAt: { not: null } }, orderBy: { dueAt: "asc" }, take: 1 } } }),
    prisma.onboardingRequest.count({ where }), prisma.onboardingRequest.groupBy({ by: ["salesStage"], _count: true }), platformOwners(),
    prisma.crmActivity.count({ where: { leadId: { not: null }, completedAt: null, dueAt: { lt: new Date() } } }),
    prisma.onboardingRequest.groupBy({ by: ["currencyCode"], where: { salesStage: { notIn: ["WON", "LOST"] } }, _sum: { expectedMonthlyValue: true } }),
  ]);
  const href = (next: number) => `/platform/crm?${new URLSearchParams({ q, source: params.source ?? "", stage: stage ?? "", owner: params.owner ?? "", due: params.due ?? "", page: String(next) })}`;
  return <CrmShell platform title="Sales CRM" description="Move organization prospects from first contact through demos, proposals, and customer conversion.">
    <Panel><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Demo requests → guided trials</h2><p className="mt-1 text-sm text-muted-foreground">Assign an owner, agree a 30–45 minute demo, then open a 14-day Pro or Plus trial when the client is ready.</p></div><Link href="/platform/demos" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">View demo requests</Link></div></Panel>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[["Open deals", counts.filter(c => !["WON", "LOST"].includes(c.salesStage)).reduce((n, c) => n + c._count, 0)], ["Won", counts.find(c => c.salesStage === "WON")?._count ?? 0], ["Overdue follow-ups", overdue], ["Expected monthly pipeline", values.map(v => `${v.currencyCode} ${Number(v._sum.expectedMonthlyValue ?? 0).toLocaleString()}`).join(" · ") || "—"]].map(([name, value]) => <Panel key={name}>
        <p className="text-xs text-muted-foreground">{name}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </Panel>)}
    </div>
    <Panel>
      <h2 className="mb-3 font-semibold">Pipeline stages</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {stages.map(s => <Link key={s} href={`/platform/crm?stage=${s}`} className={`rounded-xl border p-3 ${stage === s ? "border-primary bg-primary/5" : "border-border"}`}>
          <p className="text-xs">{label(s)}</p>
          <p className="mt-2 text-xl font-semibold">{counts.find(c => c.salesStage === s)?._count ?? 0}</p>
        </Link>)}
      </div>
    </Panel>
    <Panel>
      <form className="grid gap-3 md:grid-cols-3">
        <Field title="Request type"><select name="source" defaultValue={params.source ?? ""} className={inputClass}><option value="">All requests</option><option value="demo">Demo requests</option></select></Field>
        <Field title="Search"><input name="q" defaultValue={q} placeholder="Company, contact, email" className={inputClass} /></Field>
        <Field title="Stage">
          <select name="stage" defaultValue={stage ?? ""} className={inputClass}>
            <option value="">All stages</option>
            {stages.map(s => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </Field>
        <Field title="Sales owner">
          <select name="owner" defaultValue={params.owner ?? ""} className={inputClass}>
            <option value="">All owners</option>
            <option value="unassigned">Unassigned</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>)}
          </select>
        </Field>
        <Field title="Follow-ups">
          <select name="due" defaultValue={params.due ?? ""} className={inputClass}>
            <option value="">All</option>
            <option value="overdue">Overdue</option>
          </select>
        </Field>
        <button className="min-h-11 self-end rounded-lg border px-4">Filter</button>
      </form>
    </Panel>
    <Panel>
      <div className="mb-4 flex justify-between">
        <h2 className="font-semibold">Prospects</h2>
        <span className="text-sm text-muted-foreground">
          {total}{" "}matching</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {leads.map(l => <Link href={`/platform/crm/${l.id}`} key={l.id} className="rounded-xl border border-border p-4 hover:border-primary">
          <div className="flex flex-wrap justify-between gap-2">
            <h3 className="font-semibold">{l.companyName}</h3>
            {l.source === "DEMO_REQUEST" && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">Demo requested</span>}
            <span className="rounded-full bg-muted px-3 py-1 text-xs">{label(l.salesStage)}</span>
          </div>
          <p className="mt-2 text-sm">
            {l.fullName}{" "}·{" "}{l.workEmail}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {l.salesOwner?.fullName ?? "Unassigned"}{" "}· Source:{" "}{l.source}{" "}{l.referralCode ? ` · Referral: ${l.referralCode}` : ""}
          </p>
          {l.demoAt && <p className="mt-2 text-xs">Demo:{" "}{dateText(l.demoAt)}{" "}EAT</p>}
          {l.crmActivities[0]?.dueAt && <p className={`mt-2 text-xs ${l.crmActivities[0].dueAt < new Date() ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}`}>Next follow-up:{" "}{dateText(l.crmActivities[0].dueAt)}{" "}EAT</p>}
        </Link>)}
      </div>
      {!leads.length && <p className="py-6 text-sm text-muted-foreground">No prospects match these filters. New registration requests appear here automatically.</p>}
      <div className="mt-5 flex items-center gap-4 text-sm">
        {page > 1 && <Link href={href(page - 1)}>Previous</Link>}
        <span>Page{" "}{page}{" "}· 25 per page</span>
        {page * 25 < total && <Link href={href(page + 1)}>Next</Link>}
      </div>
    </Panel>
    <Panel>
      <details>
        <summary className="cursor-pointer font-semibold">Add a prospect</summary>
        <CrmForm action={createSalesLead} submit="Create prospect" className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field title="Organization name"><input name="companyName" required maxLength={160} className={inputClass} /></Field>
          <Field title="Contact name"><input name="fullName" required maxLength={120} className={inputClass} /></Field>
          <Field title="Work email"><input name="workEmail" type="email" required maxLength={160} className={inputClass} /></Field>
          <Field title="Phone"><input name="phone" maxLength={40} className={inputClass} /></Field>
          <Field title="Property portfolio type"><input name="managedPropertyType" required maxLength={100} placeholder="Residential, commercial, mixed…" className={inputClass} /></Field>
          <Field title="Initial notes"><textarea name="message" maxLength={4000} className={inputClass} /></Field>
        </CrmForm>
      </details>
    </Panel>
  </CrmShell>;
}
