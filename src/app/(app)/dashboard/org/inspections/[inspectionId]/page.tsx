import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import {
  decodePublicId,
  encodePublicId,
  isEncodedPublicId,
} from "@/lib/public-id";
import { InspectionDetailsWorkspace } from "./_components/inspection-details-workspace";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    inspectionId: string;
  }>;
};

export default async function OrgInspectionDetailPage({ params }: PageProps) {
  const session = await requireManagementAccess();
  const { inspectionId: publicInspectionId } = await params;
  const inspectionId = decodePublicId(publicInspectionId, "inspection");
  const orgId = session.activeOrgId!;

  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      notice: {
        lease: {
          orgId,
          deletedAt: null,
        },
      },
    },
    include: {
      inspector: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
      notice: {
        select: {
          id: true,
          noticeDate: true,
          moveOutDate: true,
          status: true,
          notes: true,
          tenant: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
            },
          },
          lease: {
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              unit: {
                select: {
                  id: true,
                  houseNo: true,
                  property: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  building: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!inspection) {
    notFound();
  }

  if (!isEncodedPublicId(publicInspectionId)) {
    redirect(
      `/dashboard/org/inspections/${encodePublicId(inspection.id, "inspection")}`,
    );
  }

  return (
    <InspectionDetailsWorkspace
      inspection={inspection}
      orgRole={session.activeOrgRole}
    />
  );
}