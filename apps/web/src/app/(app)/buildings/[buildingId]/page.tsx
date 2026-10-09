import { notFound } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { decodePublicId } from "@/lib/public-id";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ buildingId: string }>;
};

export default async function BuildingPage({ params }: PageProps) {
  const session = await requireUserSession();
  const { buildingId: publicBuildingId } = await params;
  const buildingId = decodePublicId(publicBuildingId, "building");
  const building = await prisma.building.findFirst({
    where: { id: buildingId, property: { orgId: session.activeOrgId ?? undefined, deletedAt: null } },
    select: { name: true, property: { select: { name: true } } },
  });
  if (!building) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-3 p-4 sm:p-6">
      <p className="text-sm text-muted-foreground">{building.property.name}</p>
      <h1 className="text-2xl font-semibold">{building.name}</h1>
    </div>
  );
}
