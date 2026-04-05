import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CreditCard,
  FileBarChart2,
  Users,
  Wrench,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRelativeDate(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OrgDashboardPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        No active organisation found for your account.
      </div>
    );
  }

  const orgId = session.activeOrgId;

  const [
    organization,
    propertiesCount,
    staffCount,
    openIssuesCount,
    paymentsAggregate,
    recentPayments,
    recentIssues,
    recentStaff,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),

    prisma.property.count({
      where: {
        orgId,
        deletedAt: null,
        isActive: true,
      },
    }),

    prisma.membership.count({
      where: {
        orgId,
        role: {
          in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"],
        },
      },
    }),

    prisma.issueTicket.count({
      where: {
        orgId,
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
      },
    }),

    prisma.payment.aggregate({
      where: {
        orgId,
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.payment.findMany({
      where: {
        orgId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        targetType: true,
        payerTenant: {
          select: {
            fullName: true,
          },
        },
        waterBill: {
          select: {
            unit: {
              select: {
                houseNo: true,
              },
            },
          },
        },
        rentCharge: {
          select: {
            lease: {
              select: {
                unit: {
                  select: {
                    houseNo: true,
                  },
                },
              },
            },
          },
        },
      },
    }),

    prisma.issueTicket.findMany({
      where: {
        orgId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        property: {
          select: {
            name: true,
          },
        },
        unit: {
          select: {
            houseNo: true,
          },
        },
      },
    }),

    prisma.membership.findMany({
      where: {
        orgId,
        role: {
          in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    }),
  ]);

  const totalPayments = Number(paymentsAggregate._sum.amount ?? 0);

  const stats = [
    {
      label: "Properties",
      value: propertiesCount.toString(),
      icon: Building2,
      helper: "Registered under this organisation",
    },
    {
      label: "Staff",
      value: staffCount.toString(),
      icon: Users,
      helper: "Active organisation team members",
    },
    {
      label: "Payments",
      value: formatCurrency(totalPayments),
      icon: CreditCard,
      helper: "Total recorded payments",
    },
    {
      label: "Open Issues",
      value: openIssuesCount.toString(),
      icon: Wrench,
      helper: "Pending maintenance tickets",
    },
  ];

  const quickLinks = [
    {
      label: "Properties",
      href: "/properties",
      icon: Building2,
      description: "Manage buildings, units, and occupancy.",
    },
    {
      label: "Staff",
      href: "/staff",
      icon: Users,
      description: "View team members and organisation roles.",
    },
    {
      label: "Payments",
      href: "/payments",
      icon: CreditCard,
      description: "Track rent collections and payment records.",
    },
    {
      label: "Reports",
      href: "/reports",
      icon: FileBarChart2,
      description: "Review financial and operational summaries.",
    },
  ];

  const paymentActivities = recentPayments.map((payment) => {
    const unitHouseNo =
      payment.rentCharge?.lease.unit.houseNo ??
      payment.waterBill?.unit.houseNo ??
      null;

    return {
      id: `payment-${payment.id}`,
      createdAt: payment.createdAt,
      title: `Payment received from ${payment.payerTenant.fullName}`,
      subtitle: unitHouseNo
        ? `House ${unitHouseNo} · ${payment.targetType}`
        : `${payment.targetType} payment`,
      meta: `${formatCurrency(Number(payment.amount))} · ${formatRelativeDate(payment.createdAt)}`,
    };
  });

  const issueActivities = recentIssues.map((issue) => ({
    id: `issue-${issue.id}`,
    createdAt: issue.createdAt,
    title: issue.title,
    subtitle:
      issue.property?.name && issue.unit?.houseNo
        ? `${issue.property.name} · House ${issue.unit.houseNo} · ${issue.status.replaceAll("_", " ")}`
        : issue.property?.name
          ? `${issue.property.name} · ${issue.status.replaceAll("_", " ")}`
          : issue.status.replaceAll("_", " "),
    meta: formatRelativeDate(issue.createdAt),
  }));

  const staffActivities = recentStaff.map((staff) => ({
    id: `staff-${staff.id}`,
    createdAt: staff.createdAt,
    title: `${staff.user.fullName} added to organisation`,
    subtitle: staff.role,
    meta: formatRelativeDate(staff.createdAt),
  }));

  const activityItems = [...paymentActivities, ...issueActivities, ...staffActivities]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-sm">
        <div className="flex flex-col gap-6 px-6 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-neutral-500">
              Organisation overview
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              {organization?.name ?? "Organisation Dashboard"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base">
              Monitor properties, staff, payments, and operations for your
              registered organisation from one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              View Properties
            </Link>

            <Link
              href="/reports"
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
            >
              Open Reports
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {item.helper}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
                  <Icon className="h-5 w-5 text-neutral-700" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Jump into the main areas of your organisation workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group rounded-[24px] border border-black/10 bg-neutral-50 p-5 transition hover:border-black/20 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white ring-1 ring-black/5">
                      <Icon className="h-5 w-5 text-neutral-700" />
                    </div>

                    <ArrowRight className="h-4 w-4 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-700" />
                  </div>

                  <h3 className="mt-5 text-base font-semibold text-neutral-950">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
              Recent activity
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Latest updates across {organization?.name ?? "your organisation"}.
            </p>
          </div>

          {activityItems.length > 0 ? (
            <div className="space-y-3">
              {activityItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-black/5 bg-neutral-50 px-4 py-4"
                >
                  <p className="text-sm font-medium text-neutral-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {item.subtitle}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                    {item.meta}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/10 bg-neutral-50 px-4 py-8 text-center">
              <p className="text-sm text-neutral-600">
                No recent activity found for this organisation yet.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}