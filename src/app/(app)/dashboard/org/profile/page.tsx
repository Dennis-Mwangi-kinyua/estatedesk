import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { StaffSelfProfileView } from "@/features/staff/components/staff-self-profile-view";

export const dynamic = "force-dynamic";

const STAFF_PROFILE_ROLES = ["MANAGER", "OFFICE", "ACCOUNTANT"] as const;

export default async function OrgStaffProfilePage() {
  const session = await requireUserSession();

  if (
    !session.activeOrgId ||
    !session.activeOrgRole ||
    session.activeOrgRole === "ADMIN" ||
    session.platformRole === "PLATFORM_ADMIN" ||
    session.platformRole === "SUPER_ADMIN" ||
    !STAFF_PROFILE_ROLES.includes(
      session.activeOrgRole as (typeof STAFF_PROFILE_ROLES)[number],
    )
  ) {
    redirect("/dashboard/org");
  }

  const member = await prisma.membership.findFirst({
    where: {
      orgId: session.activeOrgId,
      userId: session.userId,
      role: session.activeOrgRole,
      employmentEndedAt: null,
    },
    select: {
      role: true,
      employmentStartedAt: true,
      org: {
        select: {
          name: true,
        },
      },
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
          fullName: true,
          username: true,
          email: true,
          phone: true,
          status: true,
          lastLoginAt: true,
        },
      },
    },
  });

  if (!member) {
    redirect("/dashboard/org");
  }

  return <StaffSelfProfileView member={member} />;
}
