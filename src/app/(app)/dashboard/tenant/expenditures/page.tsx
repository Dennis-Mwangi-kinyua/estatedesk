import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { createTenantExpenditureAction } from "./actions";

export const dynamic="force-dynamic";
const field="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm";
export default async function TenantExpendituresPage(){
  const session=await requireTenantAccess();
  const tenant=await prisma.tenant.findFirst({where:{orgId:session.activeOrgId!,userId:session.userId,deletedAt:null},include:{org:{select:{currencyCode:true}}}});
  if(!tenant) return <main className="p-6">Tenant profile not found.</main>;
  const rows=await prisma.expenditure.findMany({where:{orgId:tenant.orgId,tenantId:tenant.id},orderBy:{incurredAt:"desc"}});
  const money=(n:number,c=tenant.org.currencyCode)=>new Intl.NumberFormat("en-KE",{style:"currency",currency:c}).format(n);
  return <main className="space-y-6 p-4 sm:p-6"><header><p className="text-sm font-semibold text-emerald-700">Personal cost register</p><h1 className="text-3xl font-bold">My expenditures</h1><p className="mt-2 text-neutral-600">Record costs related to your tenancy and review costs assigned by management.</p></header><form action={createTenantExpenditureAction} className="rounded-2xl border bg-white p-5"><h2 className="font-bold">Add expenditure</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm">Description<input name="description" required className={field}/></label><label className="text-sm">Category<select name="category" className={field}><option>TENANT_REPAIR</option><option>TENANT_SERVICE</option><option>TRANSPORT</option><option>OTHER</option></select></label><label className="text-sm">Amount ({tenant.org.currencyCode})<input name="amount" type="number" min="0.01" step="0.01" required className={field}/></label><label className="text-sm">Date<input name="incurredAt" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className={field}/></label><label className="text-sm">Paid to<input name="payee" className={field}/></label><label className="text-sm">Reference<input name="reference" className={field}/></label></div><button className="mt-4 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white">Save expenditure</button></form><section className="space-y-3">{rows.map(r=><article key={r.id} className="rounded-xl border bg-white p-4"><div className="flex justify-between gap-4"><div><h2 className="font-semibold">{r.description}</h2><p className="mt-1 text-xs text-neutral-500">{r.incurredAt.toLocaleDateString("en-KE")} · {r.category.replaceAll("_"," ")} · {r.status}{r.chargeable?" · Chargeable":""}</p></div><strong>{money(Number(r.amount),r.currencyCode)}</strong></div></article>)}</section></main>;
}
