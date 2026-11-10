import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { UnitCreateWorkspace } from "./_components/unit-create-workspace";
import { decodePublicId } from "@/lib/public-id";
import { scopedPropertyWhere } from "@/lib/permissions/record-scope";
import { PlanLimitUpgrade } from "@/components/billing/plan-limit-upgrade";

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
    {query.error && !((session.activeOrgRole === "ADMIN" || session.activeOrgRole === "MANAGER") && query.error.includes("plan allows")) ? <p role="alert" className="rounded-xl border border-destructive/30 p-4 text-destructive">{query.error}</p> : null}
    {session.activeOrgRole === "ADMIN" || session.activeOrgRole === "MANAGER" ? <PlanLimitUpgrade message={query.error} /> : null}
    <UnitCreateWorkspace
      property={property}
      orgRole={session.activeOrgRole}
    />
    </>
  );
}
