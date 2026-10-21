import { requirePlatformRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { LandlordDirectory } from "@/features/landlords/directory";
import { createPlatformLandlord, mapPlatformLandlord, managePlatformLandlord } from "@/features/landlords/actions";
export default async function PlatformLandlordsPage({ searchParams }: { searchParams: Promise<{ orgId?: string }> }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const { orgId } = await searchParams;
  const organizations = await prisma.organization.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  const organization = organizations.find(org => org.id === orgId);
  return <div className="space-y-6"><form action="/platform/landlords" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"><label className="min-w-0 flex-1 space-y-2 text-sm font-medium">Organization<select name="orgId" defaultValue={organization?.id ?? ""} required className="block min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"><option value="" disabled>Choose an organization</option>{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label><button className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Open landlord directory</button></form>{organization ? <LandlordDirectory key={organization.id} orgId={organization.id} organizationName={organization.name} canCreate canMap createAction={createPlatformLandlord} mapAction={mapPlatformLandlord} manageAction={managePlatformLandlord} returnHref={`/platform/landlords?orgId=${organization.id}`} /> : <section className="rounded-xl border border-dashed border-border p-8"><h1 className="text-2xl font-semibold tracking-tight">Landlord accounts & property access</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Choose an organization to create landlord accounts and manage their property assignments. Each directory is kept within its organization.</p></section>}</div>;
}
