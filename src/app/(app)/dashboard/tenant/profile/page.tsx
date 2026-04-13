import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";

import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import TenantProfileView from "@/components/tenant/tenant-profile-view";

const tenantProfileArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    nextOfKin: true,
    profileImage: true,
  },
});

type TenantProfileResult = Prisma.TenantGetPayload<typeof tenantProfileArgs>;

export type TenantProfileViewModel = {
  id: string;
  fullName: string;
  type: "INDIVIDUAL" | "COMPANY";
  companyName: string | null;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  kraPin: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLACKLISTED";
  dataConsent: boolean;
  marketingConsent: boolean;
  profileImageUrl: string | null;
  nextOfKin: {
    name: string;
    relationship: string;
    phone: string;
    email: string | null;
  } | null;
};

function resolveProfileImageUrl(tenant: TenantProfileResult): string | null {
  const metadata = tenant.profileImage?.metadata;

  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const safeMetadata = metadata as Record<string, unknown>;

  if (typeof safeMetadata.url === "string" && safeMetadata.url.trim()) {
    return safeMetadata.url;
  }

  return null;
}

export default async function TenantProfilePage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    ...tenantProfileArgs,
  });

  if (!tenant) {
    notFound();
  }

  const viewModel: TenantProfileViewModel = {
    id: tenant.id,
    fullName: tenant.fullName,
    type: tenant.type,
    companyName: tenant.companyName,
    phone: tenant.phone,
    email: tenant.email,
    nationalId: tenant.nationalId,
    kraPin: tenant.kraPin,
    status: tenant.status,
    dataConsent: tenant.dataConsent,
    marketingConsent: tenant.marketingConsent,
    profileImageUrl: resolveProfileImageUrl(tenant),
    nextOfKin: tenant.nextOfKin
      ? {
          name: tenant.nextOfKin.name,
          relationship: tenant.nextOfKin.relationship,
          phone: tenant.nextOfKin.phone,
          email: tenant.nextOfKin.email,
        }
      : null,
  };

  return <TenantProfileView tenant={viewModel} />;
}