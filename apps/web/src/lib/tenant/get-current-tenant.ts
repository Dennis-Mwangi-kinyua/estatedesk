import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";

export async function getCurrentTenantShell() {
  const session = await requireUserSession();

  return retryTransientDatabaseOperation(
    () =>
      prisma.tenant.findFirst({
        where: {
          userId: session.userId,
          deletedAt: null,
        },
        select: {
          id: true,
          fullName: true,
          org: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    { label: "get-current-tenant-shell" },
  );
}

export async function getCurrentTenantWithActiveLease() {
  const session = await requireUserSession();

  return retryTransientDatabaseOperation(
    () =>
      prisma.tenant.findFirst({
        where: {
          userId: session.userId,
          deletedAt: null,
        },
        include: {
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
                  building: true,
                  property: true,
                  images: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "asc" },
                    take: 4,
                    select: {
                      id: true,
                      key: true,
                      fileName: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    { label: "get-current-tenant-with-active-lease" },
  );
}
