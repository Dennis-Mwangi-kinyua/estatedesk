import { requireOrgPermission } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { IssueNewWorkspace } from "../_components/issue-new-workspace";

type PageProps = {
  searchParams?: Promise<{
    title?: string;
    description?: string;
    propertyId?: string;
    unitId?: string;
    shared?: string;
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "invalid_property":
      return "The selected property is not available for this organization.";
    case "invalid_unit":
      return "The selected unit is not available for this organization.";
    default:
      return null;
  }
}

export default async function NewOrgIssuePage({ searchParams }: PageProps) {
  const session = await requireOrgPermission("maintenance.manage");
  const orgId = session.activeOrgId;

  if (!orgId) {
    return null;
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const sharedTitle = resolvedSearchParams.title?.slice(0, 120) ?? "";
  const sharedDescription = resolvedSearchParams.description?.slice(0, 2000) ?? "";
  const selectedPropertyId = resolvedSearchParams.propertyId ?? "";
  const selectedUnitId = resolvedSearchParams.unitId ?? "";
  const isSharedDraft = resolvedSearchParams.shared === "1";
  const errorMessage = getErrorMessage(resolvedSearchParams.error);

  const properties = await prisma.property.findMany({
    where: {
      orgId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      units: {
        where: { deletedAt: null },
        select: {
          id: true,
          houseNo: true,
          building: { select: { name: true } },
        },
        orderBy: { houseNo: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <IssueNewWorkspace
      properties={properties}
      sharedTitle={sharedTitle}
      sharedDescription={sharedDescription}
      selectedPropertyId={selectedPropertyId}
      selectedUnitId={selectedUnitId}
      isSharedDraft={isSharedDraft}
      errorMessage={errorMessage}
      orgRole={session.activeOrgRole}
    />
  );
}