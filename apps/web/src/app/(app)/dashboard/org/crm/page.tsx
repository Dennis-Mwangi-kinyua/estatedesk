import { requireOrgCrmAccess } from "@/features/crm/access";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

import { CrmShell, Panel, inputClass } from "@/features/crm/ui";
import { tenantCrmWhere } from "@/features/crm/policy";
import { pageNumber } from "@/features/crm/queries";
export const dynamic = "force-dynamic";
export default async function OrgCrmPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; due?: string }> }) {
  const session = await requireOrgCrmAccess(); const p = await searchParams; const q = (p.q ?? "").trim().slice(0, 160); const page = pageNumber(p.page);
  const where: Prisma.TenantWhereInput = { ...tenantCrmWhere(session.activeOrgId!, session.membershipScope), ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}), ...(p.due === "overdue" ? { crmActivities: { some: { scopeOrgId: session.activeOrgId!, completedAt: null, dueAt: { lt: new Date() } } } } : {}) };
  const [customers, total] = await Promise.all([prisma.tenant.findMany({ where, orderBy: [{ fullName: "asc" }, { id: "asc" }], skip: (page - 1) * 25, take: 25, select: { id: true, fullName: true, email: true, phone: true, status: true, companyName: true, crmActivities: { where: { scopeOrgId: session.activeOrgId!, completedAt: null, dueAt: { not: null } }, take: 1, orderBy: { dueAt: "asc" } } } }), prisma.tenant.count({ where })]);
  const href = (next: number) => `/dashboard/org/crm?${new URLSearchParams({ q, due: p.due ?? "", page: String(next) })}`;
  return <CrmShell title="Customer CRM" description="Tenant contacts, customer conversations, and the next action for every relationship.">
    <Panel>
      <form className="flex flex-wrap gap-3">
        <input name="q" aria-label="Search customers" defaultValue={q} placeholder="Name, email, phone" className={`${inputClass} max-w-md`} />
        <select name="due" aria-label="Follow-up filter" defaultValue={p.due ?? ""} className={`${inputClass} max-w-xs`}>
          <option value="">All customers</option>
          <option value="overdue">Overdue follow-ups</option>
        </select>
        <button className="rounded-lg border px-4 py-2">Search</button>
        <Link className="rounded-lg border px-4 py-2 text-sm" href="/dashboard/org/tenants/new">Add customer</Link>
      </form>
    </Panel>
    <Panel>
      <p className="mb-4 text-sm text-muted-foreground">
        {total}{" "}customers</p>
      <div className="grid gap-3 md:grid-cols-2">
        {customers.map(c => <Link key={c.id} href={`/dashboard/org/crm/${c.id}`} className="rounded-xl border p-4 hover:border-primary">
          <h2 className="font-semibold">{c.fullName}</h2>
          <p className="mt-2 text-sm">
            {c.email ?? "No email"}{" "}·{" "}{c.phone}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {c.status}{" "}{c.companyName ? ` · ${c.companyName}` : ""}
          </p>
          <p className="mt-2 text-xs">{c.crmActivities.length ? "Open follow-up" : "No open follow-ups"}</p>
        </Link>)}
      </div>
      {!customers.length && <p className="text-sm text-muted-foreground">No customers match this search.</p>}
      <div className="mt-5 flex gap-4 text-sm">
        {page > 1 && <Link href={href(page - 1)}>Previous</Link>}
        <span>Page{" "}{page}
        </span>
        {page * 25 < total && <Link href={href(page + 1)}>Next</Link>}
      </div>
    </Panel>
  </CrmShell>;
}
