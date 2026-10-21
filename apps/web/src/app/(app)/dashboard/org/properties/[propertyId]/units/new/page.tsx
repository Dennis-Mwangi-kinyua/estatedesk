import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { UnitCreateWorkspace } from "./_components/unit-create-workspace";
import { decodePublicId } from "@/lib/public-id";
import { scopedPropertyWhere } from "@/lib/permissions/record-scope";

type NewUnitPageProps = {
  searchParams: Promise<{ created?: string; error?: string }>;
  params: Promise<{
    propertyId: string;
  }>;
};

export default async function NewUnitPage({ params, searchParams }: NewUnitPageProps) {
  const query = await searchParams;
  const session = await requireManagementAccess();
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
    <>
    {query.created === "1" ? <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-4">Unit created. Add the next unit below.</p> : null}
    {query.error ? <p role="alert" className="rounded-xl border border-destructive/30 p-4 text-destructive">{query.error}</p> : null}
    <UnitCreateWorkspace
      property={property}
      orgRole={session.activeOrgRole}
    />
    </>
  );
}
