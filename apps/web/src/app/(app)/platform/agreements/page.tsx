import Link from "@/components/navigation/workspace-link";
import { Plus, ArrowRight, Search } from "lucide-react";
import type { Prisma, DocumentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { agreementData, AGREEMENT_ENTITY } from "@/lib/service-agreements/contract";
import { agreementViews, agreementView, agreementListHref } from "@/lib/service-agreements/listing";
import { AgreementCard } from "@/components/service-agreements/agreement-card";
import { PageHeader, Surface } from "../_components/control-plane";
export const dynamic = "force-dynamic";
const PAGE_SIZE = 12;
export default async function Page({ searchParams }: { searchParams: Promise<{orgId?: string; q?: string; view?: string; page?: string}> }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const params = await searchParams;
  const view = agreementView(params.view);
  const q = params.q?.trim().slice(0,200) ?? "";
  const filters = {orgId:params.orgId,q};
  const where: Prisma.DocumentRecordWhereInput = {entityType:AGREEMENT_ENTITY,...(params.orgId ? {orgId:params.orgId} : {}),...(q ? {OR:[{title:{contains:q,mode:"insensitive"}},{serialNumber:{contains:q,mode:"insensitive"}},{org:{name:{contains:q,mode:"insensitive"}}}]} : {})};
  const [orgs, groups] = await Promise.all([
    prisma.organization.findMany({where:{deletedAt:null},orderBy:{name:"asc"},select:{id:true,name:true}}),
    prisma.documentRecord.groupBy({by:["status"],where,_count:{_all:true}}),
  ]);
  const countFor = (statuses: readonly DocumentStatus[]) => groups.reduce((sum,group) => sum + (!statuses.length || statuses.includes(group.status) ? group._count._all : 0),0);
  const total = countFor(view.statuses);
  const pageCount = Math.max(1,Math.ceil(total/PAGE_SIZE));
  const requestedPage = Number(params.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage,pageCount) : 1;
  const documents = await prisma.documentRecord.findMany({where:{...where,...(view.statuses.length ? {status:{in:[...view.statuses]}} : {})},orderBy:[{createdAt:"desc"},{id:"desc"}],skip:(page-1)*PAGE_SIZE,take:PAGE_SIZE,include:{org:{select:{name:true}}}});
  const newHref = `/platform/agreements/new${params.orgId ? `?orgId=${encodeURIComponent(params.orgId)}` : ""}`;
  return <div className="engineering-workspace mx-auto w-full min-w-0 max-w-7xl space-y-6">
    <PageHeader eyebrow="Platform administration" title="Service agreements" description="Track organization agreements from draft to signature, manage cancelled requests, and open completed agreements for download and verification." action={<Link href={newHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="size-4" aria-hidden="true" />New agreement</Link>} />
    <nav aria-label="Agreement categories" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {agreementViews.map(item => <Link key={item.key} href={agreementListHref(item.key,filters)} aria-current={view.key === item.key ? "page" : undefined} className={`flex min-w-0 flex-col gap-2 rounded-2xl border p-4 shadow-sm transition hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary ${view.key === item.key ? "border-primary bg-primary/5" : "border-border bg-card"}`}><div className="flex items-start justify-between gap-2"><span className="text-sm font-semibold">{item.label}</span><span className="text-xl font-bold tabular-nums">{countFor(item.statuses)}</span></div><p className="text-xs leading-5 text-muted-foreground">{item.description}</p></Link>)}
      <Link href={newHref} className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-4 transition hover:bg-primary/10"><span className="flex items-center gap-2 text-sm font-semibold"><Plus className="size-5" aria-hidden="true" />Create a new agreement</span><p className="text-xs leading-5 text-muted-foreground">Choose an organization and prepare its service agreement and DPA.</p><span className="inline-flex items-center gap-2 text-xs font-semibold text-primary">Start an unsigned draft<ArrowRight className="size-4" aria-hidden="true" /></span></Link>
    </nav>
    <Surface title="Find an agreement" description="Search by organization, agreement title, or document number. Category counts reflect these filters."><form method="get" className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:p-5"><input type="hidden" name="view" value={view.key} /><label className="space-y-2 text-sm"><span className="font-medium">Search agreements</span><input type="search" name="q" defaultValue={q} maxLength={200} placeholder="Organization or document number" className="min-h-11 w-full rounded-xl border border-input bg-background px-3" /></label><label className="space-y-2 text-sm"><span className="font-medium">Organization</span><select name="orgId" defaultValue={params.orgId ?? ""} className="min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3"><option value="">All organizations</option>{orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label><div className="flex items-end gap-2"><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Search className="size-4" aria-hidden="true" />Apply filters</button>{q || params.orgId ? <Link href={agreementListHref(view.key)} className="inline-flex min-h-11 items-center rounded-xl border px-3 text-sm font-medium">Clear</Link> : null}</div></form></Surface>
    <Surface title={view.label} description={`${total} ${total === 1 ? "agreement" : "agreements"}${total ? ` · Showing ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,total)}` : ""}. Open a card to review its terms, signatures, and history.`}>
      {documents.length ? <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">{documents.map(doc => {const data=agreementData(doc.metadata); return <AgreementCard key={doc.id} agreement={{id:doc.id,organization:doc.org.name,serialNumber:doc.serialNumber,status:doc.status,createdAt:doc.createdAt.toISOString(),updatedAt:doc.updatedAt.toISOString(),organizationSigned:!!data.organizationSignature,platformSigned:!!data.platformSignature,templateVersion:data.templateVersion,cancellationReason:doc.revocationReason}} />;})}</div> : <div className="space-y-3 p-8 text-center"><p className="font-semibold">No {view.label.toLowerCase()} {q || params.orgId ? "match your filters" : "yet"}.</p><p className="text-sm text-muted-foreground">{view.key === "cancelled" ? "Cancelled drafts and signing requests will appear here with their cancellation reason." : "Choose another category, adjust your filters, or create a new agreement."}</p><Link href={newHref} className="inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold">Create a new agreement</Link></div>}
      {pageCount > 1 ? <nav aria-label="Agreement pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm"><span>Page {page} of {pageCount}</span><div className="flex gap-2">{page > 1 ? <Link href={agreementListHref(view.key,{...filters,page:page-1})} className="inline-flex min-h-11 items-center rounded-xl border px-4">Previous</Link> : null}{page < pageCount ? <Link href={agreementListHref(view.key,{...filters,page:page+1})} className="inline-flex min-h-11 items-center rounded-xl border px-4">Next</Link> : null}</div></nav> : null}
    </Surface>
  </div>;
}
