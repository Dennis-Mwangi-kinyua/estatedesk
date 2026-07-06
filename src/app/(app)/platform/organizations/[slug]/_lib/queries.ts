import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { jsonKeys } from "./helpers";

export async function getOrganizationDetailData(
  slugParam: { slug: string },
  searchParamsValue: { deleteError?: string; archiveError?: string } | undefined,
) {
  const { slug } = slugParam;
  const statusParams = searchParamsValue;

  const org = await prisma.organization.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      deletedAt: null,
    },
    include: {
      subscription: {
        include: {
          planChanges: {
            orderBy: { effectiveFrom: "desc" },
            take: 3,
          },
        },
      },
      settings: true,
      kraIntegration: true,
      _count: {
        select: {
          apiKeys: true,
          assets: true,
          auditLogs: true,
          invitations: true,
          issues: true,
          leases: true,
          memberships: true,
          notifications: true,
          payments: true,
          properties: true,
          tenants: true,
          waterBills: true,
        },
      },
    },
  });

  if (!org) {
    notFound();
  }

  if (slug !== org.slug) {
    redirect(`/platform/organizations/${org.slug}`);
  }

  const [
    paymentTotal,
    unitCount,
    recentPayments,
    recentMembers,
    recentAuditLogs,
    recentMessages,
  ] =
    await Promise.all([
      prisma.payment.aggregate({
        where: {
          orgId: org.id,
          OR: [
            { gatewayStatus: "SUCCESS" },
            { verificationStatus: "VERIFIED" },
            { verificationStatus: "NOT_REQUIRED" },
          ],
        },
        _sum: { amount: true },
      }),
      prisma.unit.count({
        where: {
          deletedAt: null,
          property: {
            orgId: org.id,
          },
        },
      }),
      prisma.payment.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          payerTenant: { select: { fullName: true } },
          payerUser: { select: { fullName: true } },
        },
      }),
      prisma.membership.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              status: true,
              lastLoginAt: true,
            },
          },
        },
      }),
      prisma.auditLog.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          actor: { select: { fullName: true, email: true } },
        },
      }),
      prisma.platformMessage.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          sender: { select: { fullName: true, email: true } },
        },
      }),
    ]);

  const featureKeys = jsonKeys(org.settings?.features);
  const paidTotal = Number(paymentTotal._sum.amount ?? 0);
  return {
    org,
    statusParams,
    featureKeys,
    paidTotal,
    unitCount,
    recentPayments,
    recentMembers,
    recentAuditLogs,
    recentMessages,
  };
}
