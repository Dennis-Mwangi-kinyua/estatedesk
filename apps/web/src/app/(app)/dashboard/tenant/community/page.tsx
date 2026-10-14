import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { CommunityBoard } from "@/features/community/board";
export default async function CommunityPage() {
  const session = await requireTenantAccess();
  const tenant = await prisma.tenant.findFirst({ where: { orgId: session.activeOrgId!, userId: session.userId, deletedAt: null }, select: { id: true } });
  return <main className="mx-auto max-w-4xl p-4 sm:p-6"><h1 className="sr-only">Official community notices</h1>{tenant ? <CommunityBoard tenantId={tenant.id} /> : <p>No tenant profile is linked to this account.</p>}</main>;
}
