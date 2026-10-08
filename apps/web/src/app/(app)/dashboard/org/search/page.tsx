import Link from "next/link";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";

export default async function OrganisationSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireManagementAccess();
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const orgId = session.activeOrgId!;
  const text = { contains: q, mode: "insensitive" as const };
  const role = session.activeOrgRole;
  const portfolioAccess = ["ADMIN", "MANAGER", "OFFICE"].includes(role ?? "");
  const [properties, units, tenants] = q.length < 2 || !portfolioAccess ? [[], [], []] : await Promise.all([
    prisma.property.findMany({ where: { orgId, deletedAt: null, name: text }, select: { id: true, name: true }, take: 20, orderBy: { name: "asc" } }),
    prisma.unit.findMany({ where: { deletedAt: null, property: { orgId, deletedAt: null }, houseNo: text }, select: { id: true, houseNo: true, property: { select: { name: true } } }, take: 20, orderBy: { houseNo: "asc" } }),
    prisma.tenant.findMany({ where: { orgId, deletedAt: null, OR: [{ fullName: text }, { email: text }, { phone: text }] }, select: { id: true, fullName: true }, take: 20, orderBy: { fullName: "asc" } }),
  ]);
  const [payments, issues, leases] = q.length < 2 ? [[], [], []] : await Promise.all([
    prisma.payment.findMany({ where: { orgId, OR: [{ reference: text }, { externalReference: text }] }, select: { id: true, reference: true, externalReference: true }, take: 20, orderBy: { createdAt: "desc" } }),
    portfolioAccess ? prisma.issueTicket.findMany({ where: { orgId, title: text }, select: { id: true, title: true }, take: 20, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
    portfolioAccess ? prisma.lease.findMany({ where: { orgId, deletedAt: null, tenant: { deletedAt: null }, unit: { deletedAt: null }, OR: [{ tenant: { fullName: text } }, { unit: { houseNo: text } }] }, select: { id: true, tenant: { select: { fullName: true } }, unit: { select: { houseNo: true } } }, take: 20, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
  ]);
  const groups = [
    { title: "Payments", rows: payments.map(p => ({ label: p.reference || p.externalReference || p.id, href: `/dashboard/org/payments?q=${encodeURIComponent(p.reference || p.externalReference || p.id)}` })) },
    { title: "Issues", rows: issues.map(i => ({ label: i.title, href: `/dashboard/org/issues/${i.id}` })) },
    { title: "Leases", rows: leases.map(l => ({ label: `${l.tenant.fullName} · ${l.unit.houseNo}`, href: `/dashboard/org/leases/${l.id}` })) },
    { title: "Properties", rows: properties.map(p => ({ label: p.name, href: `/dashboard/org/properties/${p.id}` })) },
    { title: "Units", rows: units.map(u => ({ label: `${u.houseNo} · ${u.property.name}`, href: `/dashboard/org/units/${u.id}` })) },
    { title: "Tenants", rows: tenants.map(t => ({ label: t.fullName, href: `/dashboard/org/tenants/${t.id}` })) },
  ].filter(g => portfolioAccess || g.title === "Payments");
  return <div className="space-y-5"><h1 className="text-2xl font-semibold">Search organisation</h1><form className="flex gap-2"><label className="flex-1"><span className="sr-only">Search your organisation</span><input name="q" defaultValue={q} maxLength={100} placeholder="Search names, units, issues, or payment references…" className="min-h-12 w-full rounded-xl border border-border bg-card px-4" /></label><button data-workspace-action="true" className="rounded-xl bg-primary px-4 text-primary-foreground">Search</button></form>{q.length < 2 ? <p className="text-muted-foreground">Enter at least two characters.</p> : <>{groups.every(g => !g.rows.length) && <p role="status">No results found. Try a name, unit number, email, or phone.</p>}{groups.map(g => <section key={g.title} className="rounded-xl border border-border bg-card p-4"><h2 className="font-semibold">{g.title} ({g.rows.length})</h2><ul className="mt-3 space-y-2">{g.rows.map(r => <li key={r.href}><Link className="block break-words rounded-lg p-2 text-primary hover:bg-muted" href={r.href}>{r.label}</Link></li>)}</ul>{g.rows.length === 20 && <p className="text-sm text-muted-foreground">Showing the first 20 results. Refine your search.</p>}</section>)}</>}</div>;
}
