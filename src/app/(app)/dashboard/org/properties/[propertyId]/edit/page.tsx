import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { PropertyEditWorkspace } from "./_components/property-edit-workspace";

type EditPropertyPageProps = {
  params: Promise<{
    propertyId: string;
  }>;
};

export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
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
      location: true,
      address: true,
      notes: true,
      waterRatePerUnit: true,
      waterFixedCharge: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          units: true,
          buildings: true,
          issues: true,
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  return (
    <PropertyEditWorkspace
      property={property}
      orgRole={session.activeOrgRole}
    />
  );
}