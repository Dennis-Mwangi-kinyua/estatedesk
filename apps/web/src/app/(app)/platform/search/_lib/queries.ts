import { prisma } from "@/lib/prisma";

export async function getGlobalSearchResults(q: string) {
  const hasQuery = q.length >= 2;
  const textFilter = { contains: q, mode: "insensitive" as const };

  if (!hasQuery) {
    return {
      hasQuery: false,
      orgs: [],
      users: [],
      tenants: [],
      payments: [],
      units: [],
    };
  }

  const [orgs, users, tenants, payments, units] = await Promise.all([
    prisma.organization.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: textFilter },
          { slug: textFilter },
          { email: textFilter },
          { phone: textFilter },
        ],
      },
      take: 10,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { fullName: textFilter },
          { email: textFilter },
          { phone: textFilter },
          { username: textFilter },
        ],
      },
      take: 10,
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        phone: true,
        platformRole: true,
        updatedAt: true,
      },
    }),
    prisma.tenant.findMany({
      where: {
        deletedAt: null,
        OR: [
          { fullName: textFilter },
          { email: textFilter },
          { phone: textFilter },
          { nationalId: textFilter },
          { kraPin: textFilter },
        ],
      },
      take: 10,
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        phone: true,
        status: true,
        updatedAt: true,
        org: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.payment.findMany({
      where: {
        OR: [
          { reference: textFilter },
          { externalReference: textFilter },
          { checkoutRequestId: textFilter },
          { merchantRequestId: textFilter },
          { phoneUsed: textFilter },
          { payerName: textFilter },
        ],
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reference: true,
        externalReference: true,
        checkoutRequestId: true,
        amount: true,
        targetType: true,
        gatewayStatus: true,
        createdAt: true,
        org: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.unit.findMany({
      where: {
        deletedAt: null,
        OR: [{ houseNo: textFilter }, { property: { name: textFilter } }],
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        houseNo: true,
        status: true,
        updatedAt: true,
        property: {
          select: {
            name: true,
            org: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    }),
  ]);

  return {
    hasQuery: true,
    orgs,
    users,
    tenants,
    payments,
    units,
  };
}