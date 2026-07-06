import { getOnlineSince } from "@/lib/auth/presence";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import type { StaffRole } from "@/features/staff/constants/role-meta";

export async function getRoleMembersDirectoryData(role: StaffRole) {
  const orgId = await requireCurrentOrgId();
  const now = new Date();
  const onlineSince = getOnlineSince(now);

  const membershipWhere = {
    orgId,
    role,
    employmentEndedAt: null,
    org: { deletedAt: null },
    user: { deletedAt: null },
  };

  const [members, onlineMembers] = await retryTransientDatabaseOperation(
    () =>
      Promise.all([
    prisma.membership.findMany({
      where: membershipWhere,
      orderBy: [{ user: { fullName: "asc" } }, { createdAt: "desc" }],
      select: {
        id: true,
        role: true,
        scopeType: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            lastLoginAt: true,
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
    prisma.userSession.count({
      where: {
        expiresAt: { gt: now },
        lastSeenAt: { gte: onlineSince },
        user: {
          status: "ACTIVE",
          deletedAt: null,
          memberships: { some: membershipWhere },
        },
      },
    }),
      ]),
    { label: "getRoleMembersDirectoryData" },
  );

  const caretakerUserIds =
    role === "CARETAKER" ? members.map((member) => member.user.id) : [];

  const assignments =
    caretakerUserIds.length > 0
      ? await retryTransientDatabaseOperation(
          () =>
            prisma.caretakerAssignment.findMany({
          where: {
            orgId,
            active: true,
            caretakerUserId: { in: caretakerUserIds },
          },
          select: {
            caretakerUserId: true,
            isPrimary: true,
            property: { select: { name: true } },
            building: {
              select: {
                name: true,
                property: { select: { name: true } },
              },
            },
            unit: {
              select: {
                houseNo: true,
                property: { select: { name: true } },
                building: { select: { name: true } },
              },
            },
          },
            }),
          { label: "getRoleMembersDirectoryData-assignments" },
        )
      : [];

  const assignmentsByUserId = new Map<string, typeof assignments>();

  for (const assignment of assignments) {
    const current = assignmentsByUserId.get(assignment.caretakerUserId) ?? [];
    current.push(assignment);
    assignmentsByUserId.set(assignment.caretakerUserId, current);
  }

  const rows = members.map((member) => {
    const latestSession = member.user.sessions[0] ?? null;
    const lastSeenAt = latestSession?.lastSeenAt ?? member.user.lastLoginAt;
    const isOnline = Boolean(
      latestSession &&
        latestSession.expiresAt > now &&
        latestSession.lastSeenAt >= onlineSince,
    );

    return {
      ...member,
      isOnline,
      lastSeenAt,
      assignments: assignmentsByUserId.get(member.user.id) ?? [],
    };
  });

  const activeAccounts = rows.filter(
    (member) => member.user.status === "ACTIVE",
  ).length;

  const mappedCaretakers =
    role === "CARETAKER"
      ? rows.filter((member) => member.assignments.length > 0).length
      : 0;

  return {
    role,
    rows,
    totalMembers: rows.length,
    onlineMembers,
    activeAccounts,
    mappedCaretakers,
    totalAssignments: assignments.length,
    now,
  };
}

export type RoleMembersDirectoryData = Awaited<
  ReturnType<typeof getRoleMembersDirectoryData>
>;