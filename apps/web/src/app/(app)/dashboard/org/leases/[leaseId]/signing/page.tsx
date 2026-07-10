import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { LeaseSigningWorkspace } from "./_components/lease-signing-workspace";

export const dynamic = "force-dynamic";

export default async function LeaseSigningPage({
  params,
}: {
  params: Promise<{ leaseId: string }>;
}) {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  const { leaseId } = await params;

  const lease = await prisma.lease.findFirst({
    where: {
      id: leaseId,
      orgId: session.activeOrgId!,
      deletedAt: null,
    },
    include: {
      tenant: true,
      unit: { include: { property: true } },
      contractDocument: true,
      signatureEnvelopes: {
        include: {
          signers: true,
          events: { orderBy: { createdAt: "desc" }, take: 10 },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lease) {
    notFound();
  }

  const [members, tenantUsers, landlords] = await Promise.all([
    prisma.membership.findMany({
      where: {
        orgId: session.activeOrgId!,
        employmentEndedAt: null,
      },
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { user: { fullName: "asc" } },
    }),
    prisma.tenant.findMany({
      where: {
        orgId: session.activeOrgId!,
        userId: { not: null },
        id: { not: lease.tenantId },
        deletedAt: null,
      },
      select: { userId: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.landlordProfile.findMany({
      where: {
        orgId: session.activeOrgId!,
        isActive: true,
        deletedAt: null,
      },
      select: { userId: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
  ]);

  const finalIds = lease.signatureEnvelopes.flatMap((envelope) =>
    envelope.finalAssetId ? [envelope.finalAssetId] : [],
  );
  const assets = await prisma.asset.findMany({
    where: { id: { in: finalIds } },
  });
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  return (
    <LeaseSigningWorkspace
      data={{
        lease,
        members,
        tenantUsers,
        landlords,
        assetMap,
      }}
    />
  );
}