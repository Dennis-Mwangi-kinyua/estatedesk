import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { PropertyEditWorkspace } from "./_components/property-edit-workspace";
import { decodePublicId } from "@/lib/public-id";
import { canViewWholeProperty, scopedPropertyWhere } from "@/lib/permissions/record-scope";

type EditPropertyPageProps = {
  params: Promise<{
    propertyId: string;
  }>;
};

export default async function EditPropertyPage({
  params,
}: EditPropertyPageProps) {
  const session = await requireManagementAccess();
  if (!canViewWholeProperty(session.membershipScope)) notFound();
  const { propertyId: rawPropertyId } = await params;
  const propertyId = decodePublicId(rawPropertyId, "property");

  const property = await prisma.property.findFirst({
    where: {
      AND: [scopedPropertyWhere(session.activeOrgId!, session.membershipScope), { id: propertyId }],
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
