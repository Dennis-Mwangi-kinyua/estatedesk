import Link from "@/components/navigation/workspace-link";
import { TenantStatus } from "@prisma/client";
import { encodePublicId } from "@/lib/public-id";
import { getTenantDirectory } from "./queries";
import { Pager, Empty, formatTime, rowClass } from "./ui";
import { OrgSurface } from "../_components/org-detail-ui";
export const dynamic = "force-dynamic";
export default async function PlatformTenantDirectory({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const { org, tenants, total, page, q, status } = await getTenantDirectory((await params).slug, await searchParams);
  const base = `/platform/organizations/${org.slug}/tenants`;
  return <main className="mx-auto max-w-7xl space-y-5"><Link href={`/platform/organizations/${org.slug}#organisation-members`} className="text-sm font-semibold text-primary">← {org.name}</Link><header><h1 className="text-2xl font-bold">Tenant directory</h1><p className="mt-2 text-sm text-muted-foreground">View tenant profiles, leases, payments, charges, and individual activity for {org.name}.</p></header>
    <form className="flex flex-wrap gap-3 rounded-2xl border bg-card p-4"><label className="flex-1 text-sm">Search tenants<input name="q" defaultValue={q} maxLength={150} placeholder="Name, company, phone, or email" className="mt-1 block min-h-11 w-full rounded-lg border bg-background px-3" /></label><label className="text-sm">Status<select name="status" defaultValue={status} className="mt-1 block min-h-11 rounded-lg border bg-background px-3"><option value="">All statuses</option>{Object.values(TenantStatus).map(value => <option key={value}>{value}</option>)}</select></label><button className="self-end rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Search</button><Link href={base} className="self-end px-3 py-3 text-sm">Reset</Link></form>
    <OrgSurface title="Tenants" description={`${total} matching tenant records`}>
      {tenants.length ? tenants.map(tenant => <article key={tenant.id} className={`${rowClass} flex flex-wrap items-center justify-between gap-4`}><div><Link href={`${base}/${encodePublicId(tenant.id, "tenant")}`} className="font-semibold text-primary underline">{tenant.fullName}</Link><p className="mt-1 text-sm">{tenant.phone} · {tenant.email || "No email"}</p><p className="mt-1 text-xs text-muted-foreground">{tenant.leases[0] ? `${tenant.leases[0].unit.property.name} / Unit ${tenant.leases[0].unit.houseNo}` : "No active lease"}</p></div><div className="text-sm"><p>{tenant.status} · {tenant._count.leases} leases · {tenant._count.payments} payments</p><p className="mt-1 text-xs text-muted-foreground">Last login: {formatTime(tenant.user?.lastLoginAt)}</p></div><Link href={`${base}/${encodePublicId(tenant.id, "tenant")}`} className="rounded-lg border px-4 py-2 text-sm font-semibold">View tenant details →</Link></article>) : <Empty>No tenants match these filters.</Empty>}
    </OrgSurface><Pager page={page} total={total} href={next => `${base}?${new URLSearchParams({ q, status, page: String(next) })}`} />
  </main>;
}
