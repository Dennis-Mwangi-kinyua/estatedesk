import { requireUserSession } from "@/lib/auth/session";
import { scopedUnitWhere, scopedPaymentWhere } from "@/lib/permissions/record-scope";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureTenantSlug } from "@/lib/tenants/slug";
import { formatCurrency, formatDate, formatStatus, getLeaseUnitLabel, toNumberValue } from "./helpers";

export async function loadTenantDetailsData(orgId: string, tenantId: string, activeOrgRole?: string | null) {
  if (!tenantId?.trim()) notFound();
  const session = await requireUserSession();
  if (session.activeOrgId !== orgId || !canAccessWorkspacePath(session, "/dashboard/org/tenants") || session.mustChangePassword || session.requiresTermsAcceptance) notFound();
  const unitScope = scopedUnitWhere(orgId, session.membershipScope);
  const scopedLease = { orgId, unit: unitScope };
  const restricted = session.membershipScope?.scopeType !== "ORG";

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [{ id: tenantId }, { slug: tenantId }],
      orgId,
      ...(restricted ? { leases: { some: scopedLease } } : {}),
    },
    select: {
      id: true,
      slug: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      type: true,
      nationalId: true,
      companyName: true,
      kraPin: true,
      notes: true,
      dataConsent: true,
      consentUpdatedAt: true,
      marketingConsent: true,
      createdAt: true,
      deletedAt: true,
      archivedAt: true,
      blacklistedAt: true,
      blacklistReason: true,
      profileImage: {
        select: {
          id: true,
          key: true,
          fileName: true,
        },
      },
      nextOfKin: {
        select: {
          name: true,
          relationship: true,
          phone: true,
          email: true,
        },
      },
      leases: {
        where: { ...scopedLease, deletedAt: null },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          dueDay: true,
          monthlyRent: true,
          deposit: true,
          status: true,
          notes: true,
          unitId: true,
          caretaker: {
            select: {
              fullName: true,
              email: true,
            },
          },
          unit: {
            select: {
              houseNo: true,
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
              building: {
                select: { name: true },
              },
              property: {
                select: { name: true },
              },
            },
          },
        },
      },
      payments: {
        where: { AND: [scopedPaymentWhere(orgId, session.membershipScope), ...(canAccessWorkspacePath(session, "/dashboard/org/payments") ? [] : [{ id: { in: [] } }])] },
        orderBy: {
          createdAt: "desc",
        },
        take: 40,
        select: {
          id: true,
          method: true,
          amount: true,
          reference: true,
          targetType: true,
          gatewayStatus: true,
          verificationStatus: true,
          paidAt: true,
          createdAt: true,
        },
      },
      rewardRedemptions: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          label: true,
          pointsCost: true,
          status: true,
          rewardId: true,
          category: true,
          createdAt: true,
        },
      },
      waterBills: {
        where: { orgId, unit: unitScope },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          period: true,
          unitsUsed: true,
          total: true,
          dueDate: true,
          status: true,
          unit: {
            select: {
              houseNo: true,
              building: {
                select: { name: true },
              },
              property: {
                select: { name: true },
              },
            },
          },
        },
      },
      moveOutNotices: {
        where: { lease: scopedLease },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        select: {
          id: true,
          noticeDate: true,
          moveOutDate: true,
          status: true,
          notes: true,
          lease: {
            select: {
              id: true,
              unit: {
                select: {
                  houseNo: true,
                  building: {
                    select: { name: true },
                  },
                  property: {
                    select: { name: true },
                  },
                },
              },
            },
          },
          inspection: {
            select: {
              id: true,
              scheduledAt: true,
              status: true,
              completedAt: true,
              inspector: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tenant) notFound();

  const canonicalSlug = await ensureTenantSlug(prisma, {
    id: tenant.id,
    orgId,
    fullName: tenant.fullName,
    slug: tenant.slug,
  });

  const activeLease =
    tenant.leases.find((lease) => String(lease.status).toUpperCase() === "ACTIVE") ??
    tenant.leases[0] ??
    null;

  const canManage = ["ADMIN", "MANAGER", "OFFICE"].includes(String(activeOrgRole));
  const isDeleted = Boolean(tenant.deletedAt);
  const isBlacklisted = String(tenant.status).toUpperCase() === "BLACKLISTED";
  const isArchived = String(tenant.status).toUpperCase() === "INACTIVE";
  const hasActiveLease = Boolean(activeLease && String(activeLease.status).toUpperCase() === "ACTIVE");

  const currentUnit = hasActiveLease ? getLeaseUnitLabel(activeLease!) : "Not assigned";
  const currentRent = hasActiveLease ? formatCurrency(activeLease!.monthlyRent) : "—";
  const currentDeposit = hasActiveLease ? formatCurrency(activeLease!.deposit) : "—";

  const totalPayments = tenant.payments.reduce((sum, payment) => {
    return sum + (toNumberValue(payment.amount) ?? 0);
  }, 0);

  const tenantHistory = [
    {
      id: `tenant-created-${tenant.id}`,
      kind: "Tenant",
      title: "Tenant profile created",
      date: tenant.createdAt,
      description: `Tenant was onboarded as ${formatStatus(tenant.type)} tenant.`,
      tag: "Created",
      tone: "default" as const,
    },
    ...tenant.leases.map((lease) => ({
      id: `lease-${lease.id}`,
      kind: "Lease",
      title: `${formatStatus(lease.status)} lease • ${getLeaseUnitLabel(lease)}`,
      date: lease.startDate,
      description: `Lease started ${formatDate(lease.startDate)}${lease.endDate ? ` and ends ${formatDate(lease.endDate)}` : ""}. Rent ${formatCurrency(lease.monthlyRent)}.`,
      tag: formatStatus(lease.status),
      tone: String(lease.status).toUpperCase() === "ACTIVE" ? ("success" as const) : ("default" as const),
    })),
    ...tenant.payments.map((payment) => ({
      id: `payment-${payment.id}`,
      kind: "Payment",
      title: `${formatStatus(payment.targetType)} payment • ${formatCurrency(payment.amount)}`,
      date: payment.paidAt ?? payment.createdAt,
      description: `${formatStatus(payment.method)} • ${formatStatus(payment.gatewayStatus)} / ${formatStatus(payment.verificationStatus)}${payment.reference ? ` • Ref ${payment.reference}` : ""}`,
      tag: formatStatus(payment.verificationStatus),
      tone: String(payment.verificationStatus).toUpperCase() === "VERIFIED"
        ? ("success" as const)
        : ("default" as const),
    })),
    ...tenant.moveOutNotices.map((notice) => ({
      id: `notice-${notice.id}`,
      kind: "Move out",
      title: `${formatStatus(notice.status)} move-out notice`,
      date: notice.noticeDate,
      description: `${getLeaseUnitLabel(notice.lease)} • Move-out date ${formatDate(notice.moveOutDate)}`,
      tag: formatStatus(notice.status),
      tone: "default" as const,
    })),
  ].filter(item => {
    const path = item.kind === "Lease" ? "/dashboard/org/leases" : item.kind === "Payment" ? "/dashboard/org/payments" : item.kind === "Move out" ? "/dashboard/org/move-outs" : "/dashboard/org/tenants";
    return canAccessWorkspacePath(session, path);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    tenant,
    canonicalSlug,
    canManage,
    activeLease,
    hasActiveLease,
    isDeleted,
    isBlacklisted,
    isArchived,
    currentUnit,
    currentRent,
    currentDeposit,
    totalPayments,
    tenantHistory,
  };
}
