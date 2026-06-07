import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { getCachedOrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { OrgDashboardLive } from "@/features/dashboard/components/org-dashboard-live";
import { getVacancyInquiryAlerts } from "@/features/dashboard/server/get-vacancy-inquiry-alerts";

const getCurrentOrgContext = cache(async function getCurrentOrgContext() {
  const session = await requireUserSession();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId ?? undefined,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

  if (membership) return membership;

  const fallbackMembership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

  if (!fallbackMembership) redirect("/dashboard");

  return fallbackMembership;
});

export default async function OrganizationDashboardPage() {
  const membership = await getCurrentOrgContext();
  const [data, vacancyInquiries] = await Promise.all([
    getCachedOrgDashboardSummary(membership.orgId),
    getVacancyInquiryAlerts(membership.orgId),
  ]);

  return (
    <OrgDashboardLive
      initialData={data}
      initialVacancyInquiries={vacancyInquiries}
      membership={membership}
      interval={30_000}
    />
  );
}
