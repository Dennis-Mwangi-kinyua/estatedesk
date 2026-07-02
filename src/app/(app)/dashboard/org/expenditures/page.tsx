import { ReceiptText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { createOrganizationExpenditureAction } from "./actions";

export const dynamic = "force-dynamic";
const field = "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm";
const categories = ["MAINTENANCE","UTILITIES","ADMINISTRATION","MARKETING","STAFF","TAX","INSURANCE","LEGAL","SOFTWARE","TRANSPORT","TENANT_REPAIR","TENANT_SERVICE","OTHER"];

export default async function OrganizationExpendituresPage() {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
  const orgId = session.activeOrgId!;
  const [org, tenants, properties, expenditures] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: orgId }, select: { currencyCode: true } }),
    prisma.tenant.findMany({ where: { orgId, deletedAt: null }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } }),
    prisma.property.findMany({ where: { orgId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.expenditure.findMany({ where: { orgId }, include: { tenant: { select: { fullName: true } } }, orderBy: { incurredAt: "desc" }, take: 100 }),
  ]);
  const total = expenditures.filter(e => e.status !== "VOIDED").reduce((sum,e)=>sum+Number(e.amount),0);
  const money = (value:number, currency=org.currencyCode)=>new Intl.NumberFormat("en-KE",{style:"currency",currency}).format(value);
  return <main className="space-y-6 p-4 sm:p-6 lg:p-8">
    <header><p className="text-sm font-semibold text-emerald-700">Organization and tenant costs</p><h1 className="text-3xl font-bold">Expenditures</h1><p className="mt-2 text-neutral-600">Record property operating costs and costs linked to individual tenants.</p></header>
    <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border bg-white p-5"><ReceiptText className="h-5 w-5 text-emerald-700"/><p className="mt-3 text-sm text-neutral-500">Recorded total</p><p className="text-2xl font-bold">{money(total)}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-neutral-500">Organization costs</p><p className="mt-2 text-2xl font-bold">{expenditures.filter(e=>e.scope==="ORGANIZATION").length}</p></div><div className="rounded-xl border bg-white p-5"><p className="text-sm text-neutral-500">Tenant-linked costs</p><p className="mt-2 text-2xl font-bold">{expenditures.filter(e=>e.scope==="TENANT").length}</p></div></section>
    <form action={createOrganizationExpenditureAction} className="rounded-xl border bg-white p-5"><h2 className="text-lg font-bold">New expenditure</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm">Description<input name="description" required className={field}/></label><label className="text-sm">Category<select name="category" className={field}>{categories.map(c=><option key={c}>{c.replaceAll("_"," ")}</option>)}</select></label><label className="text-sm">Amount ({org.currencyCode})<input name="amount" type="number" min="0.01" step="0.01" required className={field}/></label><label className="text-sm">Date<input name="incurredAt" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className={field}/></label><label className="text-sm">Tenant (optional)<select name="tenantId" className={field}><option value="">Organization cost</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.fullName}</option>)}</select></label><label className="text-sm">Property<select name="propertyId" className={field}><option value="">Not specified</option>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="text-sm">Payee<input name="payee" className={field}/></label><label className="text-sm">Reference<input name="reference" className={field}/></label><label className="text-sm">Payment method<select name="paymentMethod" className={field}><option>BANK</option><option>CASH</option><option>MPESA</option></select></label></div><div className="mt-4 flex flex-wrap gap-5 text-sm"><label><input type="checkbox" name="paid" className="mr-2"/>Already paid and post to ledger</label><label><input type="checkbox" name="chargeable" className="mr-2"/>Chargeable to tenant</label></div><button className="mt-4 rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white">Record expenditure</button></form>
    <section className="overflow-hidden rounded-xl border bg-white"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-neutral-50 text-left"><th className="p-3">Date</th><th>Description</th><th>Scope</th><th>Tenant</th><th>Status</th><th>Amount</th></tr></thead><tbody>{expenditures.map(e=><tr key={e.id} className="border-b"><td className="p-3">{e.incurredAt.toLocaleDateString("en-KE")}</td><td>{e.description}<br/><span className="text-xs text-neutral-500">{e.category.replaceAll("_"," ")}</span></td><td>{e.scope}</td><td>{e.tenant?.fullName??"—"}</td><td>{e.status}</td><td className="font-semibold">{money(Number(e.amount),e.currencyCode)}</td></tr>)}</tbody></table></div></section>
  </main>;
}
