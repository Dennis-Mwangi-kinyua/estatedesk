import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { StaffSelfProfileView } from "@/features/staff/components/staff-self-profile-view";

export const dynamic = "force-dynamic";

export default async function CaretakerStaffProfilePage() {
  const session = await requireUserSession();

  if (
    !session.activeOrgId ||
    session.activeOrgRole !== "CARETAKER" ||
    session.platformRole === "PLATFORM_ADMIN" ||
    session.platformRole === "SUPER_ADMIN"
  ) {
    redirect("/dashboard/caretaker");
  }

  const member = await prisma.membership.findFirst({
    where: {
      orgId: session.activeOrgId,
      userId: session.userId,
      role: "CARETAKER",
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
    redirect("/dashboard/caretaker");
  }

  return <StaffSelfProfileView title="My caretaker profile" member={member} />;
}
