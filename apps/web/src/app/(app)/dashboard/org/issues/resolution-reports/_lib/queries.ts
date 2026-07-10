import { prisma } from "@/lib/prisma";

const resolutionReportSelect = {
  id: true,
  issueId: true,
  workSummary: true,
  materialsUsed: true,
  tenantInstructions: true,
  submittedAt: true,
  caretaker: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  issue: {
    select: {
      id: true,
      title: true,
      priority: true,
      status: true,
      property: {
        select: {
          name: true,
        },
      },
      unit: {
        select: {
          houseNo: true,
          property: {
            select: {
              name: true,
            },
          },
        },
      },
      assignedTo: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  },
} as const;

export async function getResolutionReportsQueueData(orgId: string) {
  const queueWhere = {
    orgId,
    status: "SUBMITTED" as const,
  };

  const [pendingCount, reports] = await Promise.all([
    prisma.issueResolutionReport.count({ where: queueWhere }),
    prisma.issueResolutionReport.findMany({
      where: queueWhere,
      orderBy: { submittedAt: "asc" },
      select: resolutionReportSelect,
    }),
  ]);

  return {
    pendingCount,
    reports,
  };
}