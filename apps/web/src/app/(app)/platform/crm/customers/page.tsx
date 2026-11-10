import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { CrmShell, Panel, inputClass } from "@/features/crm/ui";
import { pageNumber } from "@/features/crm/queries";
export const dynamic = "force-dynamic";
export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; due?: string }> }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const p = await searchParams; const q = (p.q ?? "").trim().slice(0, 160); const page = pageNumber(p.page);
  const where: Prisma.OrganizationWhereInput = { deletedAt: null, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}), ...(p.due === "overdue" ? { customerActivities: { some: { completedAt: null, dueAt: { lt: new Date() } } } } : {}) };
  const [customers, total] = await Promise.all([prisma.organization.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (page - 1) * 25, take: 25, include: { subscription: true, customerActivities: { where: { completedAt: null, dueAt: { not: null } }, take: 1, orderBy: { dueAt: "asc" } } } }), prisma.organization.count({ where })]);
  const href = (next: number) => `/platform/crm/customers?${new URLSearchParams({ q, due: p.due ?? "", page: String(next) })}`;
  return <CrmShell platform title="Customer CRM" description="Organization contacts, account context, subscriptions, communication, and customer follow-ups.">
    <Panel>
      <form className="flex flex-wrap gap-3">
        <input name="q" aria-label="Search customers" defaultValue={q} placeholder="Name, email, phone" className={`${inputClass} max-w-md`} />
        <select name="due" aria-label="Follow-up filter" defaultValue={p.due ?? ""} className={`${inputClass} max-w-xs`}>
          <option value="">All customers</option>
          <option value="overdue">Overdue follow-ups</option>
        </select>
        <button className="rounded-lg border px-4 py-2">Search</button>
      </form>
    </Panel>
    <Panel>
      <p className="mb-4 text-sm text-muted-foreground">
        {total}{" "}customers</p>
      <div className="grid gap-3 md:grid-cols-2">
        {customers.map(c => <Link key={c.id} href={`/platform/crm/customers/${c.id}`} className="rounded-xl border p-4 hover:border-primary">
          <h2 className="font-semibold">{c.name}</h2>
          <p className="mt-2 text-sm">
            {c.email ?? "No email"}{" "}·{" "}{c.phone ?? "No phone"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {c.status}{" "}·{" "}{c.subscription?.plan ?? "No plan"}{" "}·{" "}{c.subscription?.status ?? "No subscription"}
          </p>
          <p className="mt-2 text-xs">{c.customerActivities.length ? "Open follow-up" : "No open follow-ups"}</p>
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
