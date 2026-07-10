import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { UnitCreateWorkspace } from "./_components/unit-create-workspace";

type NewUnitPageProps = {
  params: Promise<{
    propertyId: string;
  }>;
};

export default async function NewUnitPage({ params }: NewUnitPageProps) {
  const session = await requireManagementAccess();
  const { propertyId } = await params;

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      orgId: session.activeOrgId!,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      type: true,
      buildings: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          units: true,
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  return (
    <UnitCreateWorkspace
      property={property}
      orgRole={session.activeOrgRole}
    />
  );
}