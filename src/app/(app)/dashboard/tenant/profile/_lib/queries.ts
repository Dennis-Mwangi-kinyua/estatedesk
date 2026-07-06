import { prisma } from "@/lib/prisma";
import { getTenantLedger } from "@/lib/ledger";
import { parsePaymentInstructions } from "@/lib/payments/instructions";

export async function getTenantProfileData(
  userId: string,
  activeOrgId: string | null,
) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      userId,
      deletedAt: null,
    },
    include: {
      nextOfKin: true,
      org: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
        },
      },
      user: {
        select: {
          username: true,
          lastLoginAt: true,
          createdAt: true,
          mustChangePassword: true,
        },
      },
      leases: {
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          unit: {
            include: {
              property: {
                select: {
                  name: true,
                },
              },
              building: {
                select: {
                  name: true,
                },
              },
            },
          },
          contractDocument: {
            select: {
              mimeType: true,
              fileType: true,
              fileName: true,
              key: true,
            },
          },
        },
      },
    },
  });

  if (!tenant) {
    return {
      tenant: null,
      paymentHealth: null,
      paymentInstructions: null,
    };
  }

  const [paymentLedger, settings] = await Promise.all([
    activeOrgId ? getTenantLedger(userId, activeOrgId) : Promise.resolve(null),
    prisma.organizationSettings.findUnique({
      where: { orgId: tenant.orgId },
      select: { customFields: true },
    }),
  ]);

  return {
    tenant,
    paymentHealth: paymentLedger?.row ?? null,
    paymentInstructions: parsePaymentInstructions(settings?.customFields),
  };
}