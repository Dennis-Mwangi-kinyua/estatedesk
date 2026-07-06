import { notFound } from "next/navigation";
import { getOnlineSince } from "@/lib/auth/presence";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import {
  ROLE_META,
  normalizeStaffRole,
} from "@/features/staff/constants/role-meta";

export async function getMemberDetailData(
  orgId: string,
  roleParam: string,
  membershipIdParam: string,
) {
  const role = roleParam;
  const membershipId = membershipIdParam;
  const normalizedRole = normalizeStaffRole(role);

  if (!normalizedRole) notFound();

  const now = new Date();
  const onlineSince = getOnlineSince(now);

  const member = await retryTransientDatabaseOperation(
    () =>
      prisma.membership.findFirst({
    where: {
      id: membershipId,
      orgId,
      role: normalizedRole,
      employmentEndedAt: null,
      user: {
        is: {
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      role: true,
      scopeType: true,
      createdAt: true,
      employmentStartedAt: true,
      staffProfile: {
        select: {
          salaryAmount: true,
          salaryCurrency: true,
          educationLevel: true,
          jobTitle: true,
          nationalId: true,
          emergencyContact: true,
          notes: true,
        },
      },
      user: {
        select: {
          id: true,
          slug: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          emailVerified: true,
          phoneVerified: true,
          twoFactorEnabled: true,
          sessions: {
            orderBy: { lastSeenAt: "desc" },
            take: 1,
            select: {
              lastSeenAt: true,
              expiresAt: true,
            },
          },
        },
      },
    },
      }),
    { label: "getMemberDetailData-member" },
  );

  if (!member) notFound();

  const caretakerAssignments =
    normalizedRole === "CARETAKER"
      ? await retryTransientDatabaseOperation(
          () =>
            prisma.caretakerAssignment.findMany({
          where: {
            orgId,
            caretakerUserId: member.user.id,
          },
          orderBy: [{ active: "desc" }, { assignedAt: "desc" }],
          select: {
            id: true,
            active: true,
            assignedAt: true,
            endedAt: true,
            notes: true,
            unit: {
              select: {
                id: true,
                houseNo: true,
                status: true,
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
            property: {
              select: {
                id: true,
                name: true,
                units: {
                  where: {
                    deletedAt: null,
                    isActive: true,
                  },
                  select: {
                    id: true,
                    houseNo: true,
                    status: true,
                  },
                  orderBy: {
                    houseNo: "asc",
                  },
                },
              },
            },
            building: {
              select: {
                id: true,
                name: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                units: {
                  where: {
                    deletedAt: null,
                    isActive: true,
                  },
                  select: {
                    id: true,
                    houseNo: true,
                    status: true,
                  },
                  orderBy: {
                    houseNo: "asc",
                  },
                },
              },
            },
          },
            }),
          { label: "getMemberDetailData-assignments" },
        )
      : [];

  const meta = ROLE_META[normalizedRole];
  const latestSession = member.user.sessions[0] ?? null;
  const lastSeenAt = latestSession?.lastSeenAt ?? member.user.lastLoginAt;
  const isOnline = Boolean(
    latestSession &&
      latestSession.expiresAt > now &&
      latestSession.lastSeenAt >= onlineSince,
  );

  const activeAssignments =
    normalizedRole === "CARETAKER"
      ? caretakerAssignments.filter((assignment) => assignment.active).length
      : 0;

  return {
    member,
    caretakerAssignments,
    normalizedRole,
    meta,
    isOnline,
    lastSeenAt,
    activeAssignments,
    now,
  };
}
