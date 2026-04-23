import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { PropertyCreateWizard } from "@/features/properties/components/property-create-wizard";

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

type SearchParams = Promise<{
  error?: string;
}>;

export default async function NewOrgPropertyPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const membership = await getCurrentOrgContext();
  const params = (await searchParams) ?? {};
  const errorMessage =
    typeof params.error === "string" ? decodeURIComponent(params.error) : null;

  const taxpayerProfiles = await prisma.taxpayerProfile.findMany({
    where: {
      orgId: membership.orgId,
      deletedAt: null,
      isActive: true,
    },
    orderBy: [{ displayName: "asc" }],
    select: {
      id: true,
      displayName: true,
      kraPin: true,
      kind: true,
    },
  });

  return (
    <PropertyCreateWizard
      orgName={membership.org.name}
      currencyCode={membership.org.currencyCode}
      errorMessage={errorMessage}
      taxpayerProfiles={taxpayerProfiles}
    />
  );
}