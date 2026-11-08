import Link from "@/components/navigation/workspace-link";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

export default async function DeletedOrganizationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const value = Number((await searchParams).page ?? 1);
  const page = Number.isSafeInteger(value) && value > 0 ? Math.min(value, 100000) : 1;
  const organizations = await prisma.organization.findMany({
    where: { deletedAt: { not: null } }, orderBy: [{ deletedAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * 50, take: 51,
    select: { id: true, name: true, slug: true, deletedAt: true,
      auditLogs: { where: { action: "ORGANIZATION_DELETE_REQUESTED" }, take: 1, select: { id: true } } },
  });
  return <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
    <Link href="/platform/organizations" className="inline-flex min-h-11 items-center text-sm font-semibold">← Organizations</Link>
    <h1 className="text-2xl font-semibold">Deleted organizations</h1>
    <p className="text-sm text-muted-foreground">Deleted organizations cannot sign in or publish listings. Only platform admins can review these records. Records are permanently removed after 30 days by the daily cleanup job.</p>
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {organizations.slice(0, 50).map(org => <li key={org.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0"><p className="break-words font-semibold">{org.name}</p><p className="text-sm text-muted-foreground">Deleted {org.deletedAt!.toISOString().slice(0, 10)} · {org.auditLogs.length ? `Scheduled for removal from ${new Date(org.deletedAt!.getTime() + 30 * 86400000).toISOString().slice(0, 10)}` : "Legacy deletion — automatic purge not scheduled"}</p></div>
        <Link href={`/platform/organizations/${org.slug}`} className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold">Review records</Link>
      </li>)}
      {!organizations.length && <li className="p-5 text-muted-foreground">No deleted organizations.</li>}
    </ul>
    <div className="flex gap-4">{page > 1 && <Link href={`?page=${page - 1}`} className="min-h-11 p-2">Previous</Link>}{organizations.length > 50 && <Link href={`?page=${page + 1}`} className="min-h-11 p-2">Next</Link>}</div>
  </div>;
}
