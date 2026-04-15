import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock3,
  CreditCard,
  Droplets,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { approveMeterReading, rejectMeterReading } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AllowedRole = "ADMIN" | "MANAGER" | "OFFICE" | "ACCOUNTANT";
const ALLOWED_ROLES: AllowedRole[] = ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"];

type OrgContext = {
  orgId: string;
  role: AllowedRole;
  org: {
    id: string;
    name: string;
    slug: string;
    currencyCode: string;
    timezone: string;
  };
};

type ApprovalQueueItem = {
  id: string;
  period: string;
  prevReading: number;
  currentReading: number;
  unitsUsed: number;
  createdAt: Date;
  submittedBy: {
    id: string;
    fullName: string;
    email: string | null;
  };
  unit: {
    id: string;
    houseNo: string;
    property: {
      name: string;
      waterRatePerUnit: unknown;
      waterFixedCharge: unknown;
    };
  };
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  status: string;
  readAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
  } | null;
  tenant: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    status: string;
  } | null;
};

type PaymentItem = {
  id: string;
  amount: unknown;
  method: string;
  targetType: string;
  gatewayStatus: string;
  verificationStatus: string;
  reference: string | null;
  externalReference: string | null;
  createdAt: Date;
  paidAt: Date | null;
  payerTenant: {
    fullName: string;
  };
  rentCharge: {
    period: string;
  } | null;
  waterBill: {
    period: string;
  } | null;
  taxCharge: {
    period: string;
    taxType: string;
  } | null;
};

type PageData = {
  membership: OrgContext;
  approvalQueue: ApprovalQueueItem[];
  notifications: NotificationItem[];
  recentPayments: PaymentItem[];
  metrics: {
    totalNotifications: number;
    unreadCount: number;
    queuedCount: number;
    sentCount: number;
    failedCount: number;
  };
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatDateTime(
  value: Date | string | null | undefined,
  timezone = "Africa/Nairobi",
) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMoney(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString("en-KE")}`;
  }
}

function getNotificationStatusMeta(status: string) {
  switch (status) {
    case "SENT":
      return {
        icon: Send,
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "FAILED":
      return {
        icon: XCircle,
        tone: "border-red-200 bg-red-50 text-red-700",
      };
    default:
      return {
        icon: Clock3,
        tone: "border-amber-200 bg-amber-50 text-amber-700",
      };
  }
}

function getPaymentLabel(payment: PaymentItem) {
  if (payment.waterBill?.period) return `Water ${payment.waterBill.period}`;
  if (payment.rentCharge?.period) return `Rent ${payment.rentCharge.period}`;
  if (payment.taxCharge?.period) {
    return `${formatEnumLabel(payment.taxCharge.taxType)} ${payment.taxCharge.period}`;
  }
  return formatEnumLabel(payment.targetType);
}

async function getCurrentOrgContext(): Promise<OrgContext> {
  const session = await requireUserSession();

  const whereBase = {
    userId: session.userId,
    role: { in: ALLOWED_ROLES },
    org: {
      deletedAt: null,
      status: "ACTIVE",
    },
    user: {
      deletedAt: null,
    },
  } as const;

  if (session.activeOrgId) {
    const membership = await prisma.membership.findFirst({
      where: {
        ...whereBase,
        orgId: session.activeOrgId,
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

    if (membership) return membership as OrgContext;
  }

  const fallbackMembership = await prisma.membership.findFirst({
    where: whereBase,
    orderBy: { createdAt: "desc" },
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

  return fallbackMembership as OrgContext;
}

async function loadNotificationsPageData(): Promise<PageData> {
  const membership = await getCurrentOrgContext();

  const approvalQueue = await prisma.meterReading.findMany({
    where: {
      status: "SUBMITTED",
      unit: {
        property: {
          orgId: membership.orgId,
          deletedAt: null,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 8,
    select: {
      id: true,
      period: true,
      prevReading: true,
      currentReading: true,
      unitsUsed: true,
      createdAt: true,
      submittedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      unit: {
        select: {
          id: true,
          houseNo: true,
          property: {
            select: {
              name: true,
              waterRatePerUnit: true,
              waterFixedCharge: true,
            },
          },
        },
      },
    },
  });

  const notifications = await prisma.notification.findMany({
    where: {
      orgId: membership.orgId,
    },
    orderBy: { createdAt: "desc" },
    take: 18,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      channel: true,
      status: true,
      readAt: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
      tenant: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
  });

  const recentPayments = await prisma.payment.findMany({
    where: {
      orgId: membership.orgId,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      amount: true,
      method: true,
      targetType: true,
      gatewayStatus: true,
      verificationStatus: true,
      reference: true,
      externalReference: true,
      createdAt: true,
      paidAt: true,
      payerTenant: {
        select: {
          fullName: true,
        },
      },
      rentCharge: {
        select: {
          period: true,
        },
      },
      waterBill: {
        select: {
          period: true,
        },
      },
      taxCharge: {
        select: {
          period: true,
          taxType: true,
        },
      },
    },
  });

  return {
    membership,
    approvalQueue: approvalQueue as ApprovalQueueItem[],
    notifications: notifications as NotificationItem[],
    recentPayments: recentPayments as PaymentItem[],
    metrics: {
      totalNotifications: notifications.length,
      unreadCount: notifications.filter((item) => !item.readAt).length,
      queuedCount: notifications.filter((item) => item.status === "QUEUED").length,
      sentCount: notifications.filter((item) => item.status === "SENT").length,
      failedCount: notifications.filter((item) => item.status === "FAILED").length,
    },
  };
}

function KpiTile({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "warn" | "danger" | "success";
}) {
  const toneClass = {
    neutral: "bg-white border-black/10",
    warn: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
    success: "bg-emerald-50 border-emerald-200",
  }[tone];

  return (
    <div className={cn("rounded-3xl border p-4 shadow-sm", toneClass)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/[0.04] text-neutral-800">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function PanelHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-950 sm:text-xl">
        {title}
      </h2>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  );
}

function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-black/10 bg-neutral-50 p-6 text-center sm:p-8">
      <p className="text-sm font-medium text-neutral-900">{title}</p>
      <p className="mt-1 text-sm text-neutral-500">{message}</p>
    </div>
  );
}

function PaymentStatusBadge({
  gatewayStatus,
  verificationStatus,
}: {
  gatewayStatus: string;
  verificationStatus: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700">
      {formatEnumLabel(gatewayStatus)} / {formatEnumLabel(verificationStatus)}
    </span>
  );
}

export default async function OrganizationNotificationsPage() {
  const {
    membership,
    approvalQueue,
    notifications,
    recentPayments,
    metrics: { totalNotifications, unreadCount, queuedCount, sentCount, failedCount },
  } = await loadNotificationsPageData();

  return (
    <div className="space-y-4 bg-neutral-50/70 sm:space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/5 bg-[radial-gradient(circle_at_top_left,_rgba(0,0,0,0.04),_transparent_40%)] p-4 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                {membership.org.name} Operations Desk
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                Operations overview
              </h1>
              <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base">
                A single workspace for water approvals, payment signals, and outbound communication
                across the organization.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                  Organization time
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-950">
                  {membership.org.timezone}
                </p>
              </div>
              <Link
                href="/dashboard/org"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-6 xl:grid-cols-5">
          <KpiTile label="Pending" value={approvalQueue.length} icon={Droplets} tone="warn" />
          <KpiTile label="Unread" value={unreadCount} icon={Bell} />
          <KpiTile label="Queued" value={queuedCount} icon={Clock3} />
          <KpiTile label="Sent" value={sentCount} icon={Send} tone="success" />
          <KpiTile label="Failed" value={failedCount} icon={XCircle} tone="danger" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm sm:p-6">
            <PanelHeader
              eyebrow="Review queue"
              title="Water reading approvals"
              description="Process caretaker submissions before tenant billing is generated."
            />

            <div className="mt-5 space-y-4">
              {approvalQueue.length === 0 ? (
                <EmptyState
                  title="Nothing waiting for review"
                  message="New water readings will appear here once submitted."
                />
              ) : (
                approvalQueue.map((reading) => {
                  const rate = toNumber(reading.unit.property.waterRatePerUnit);
                  const fixed = toNumber(reading.unit.property.waterFixedCharge);
                  const projectedTotal = reading.unitsUsed * rate + fixed;

                  return (
                    <article
                      key={reading.id}
                      className="rounded-[28px] border border-black/10 bg-neutral-50 p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-neutral-700 ring-1 ring-black/5">
                              {reading.unit.property.name}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-neutral-700 ring-1 ring-black/5">
                              Unit {reading.unit.houseNo}
                            </span>
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                              Awaiting review
                            </span>
                          </div>

                          <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <h3 className="text-base font-semibold text-neutral-950 sm:text-lg">
                                Water reading for {reading.period}
                              </h3>
                              <p className="mt-1 text-sm text-neutral-500">
                                Submitted by {reading.submittedBy.fullName} on{" "}
                                {formatDateTime(reading.createdAt, membership.org.timezone)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                                Projected bill
                              </p>
                              <p className="mt-1 text-lg font-semibold text-neutral-950">
                                {formatMoney(projectedTotal, membership.org.currencyCode)}
                              </p>
                            </div>
                          </div>

                          <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {[
                              { label: "Previous", value: reading.prevReading },
                              { label: "Current", value: reading.currentReading },
                              { label: "Units Used", value: reading.unitsUsed },
                              {
                                label: "Rate / Unit",
                                value: formatMoney(rate, membership.org.currencyCode),
                              },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="rounded-2xl bg-white p-3 ring-1 ring-black/5"
                              >
                                <dt className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                                  {item.label}
                                </dt>
                                <dd className="mt-2 text-sm font-semibold text-neutral-950">
                                  {item.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </div>

                        <div className="w-full space-y-3 xl:max-w-sm">
                          <form action={approveMeterReading}>
                            <input type="hidden" name="readingId" value={reading.id} />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve and issue tenant bill
                            </button>
                          </form>

                          <form action={rejectMeterReading} className="space-y-3">
                            <input type="hidden" name="readingId" value={reading.id} />
                            <label className="block">
                              <span className="sr-only">Rejection reason</span>
                              <textarea
                                name="rejectionReason"
                                required
                                rows={3}
                                minLength={10}
                                placeholder="Add a clear rejection reason for the caretaker..."
                                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                              />
                            </label>
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject and send back
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm sm:p-6">
            <PanelHeader
              eyebrow="Activity log"
              title="Communication feed"
              description="Recent notifications sent to tenants, staff, and caretakers."
            />

            <div className="mt-5 space-y-3">
              {notifications.length === 0 ? (
                <EmptyState
                  title="No notifications yet"
                  message="When messages are queued or delivered, they will appear here."
                />
              ) : (
                notifications.map((notification) => {
                  const meta = getNotificationStatusMeta(notification.status);
                  const StatusIcon = meta.icon;

                  return (
                    <article
                      key={notification.id}
                      className="rounded-3xl border border-black/5 bg-neutral-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                            meta.tone,
                          )}
                        >
                          <StatusIcon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-neutral-950">
                              {notification.title}
                            </p>
                            {!notification.readAt && (
                              <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-medium text-white">
                                New
                              </span>
                            )}
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                meta.tone,
                              )}
                            >
                              {formatEnumLabel(notification.status)}
                            </span>
                          </div>

                          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                            {notification.message}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <span>{formatEnumLabel(notification.type)}</span>
                            <span>•</span>
                            <span>{formatEnumLabel(notification.channel)}</span>
                            <span>•</span>
                            <span>
                              {formatDateTime(notification.createdAt, membership.org.timezone)}
                            </span>
                          </div>

                          {(notification.user || notification.tenant) && (
                            <p className="mt-2 text-xs text-neutral-500">
                              Recipient:{" "}
                              {notification.tenant?.fullName ??
                                notification.user?.fullName ??
                                "—"}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Loaded", value: totalNotifications },
                { label: "Unread", value: unreadCount },
                { label: "Queued", value: queuedCount },
                { label: "Failed", value: failedCount },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-black/5"
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-neutral-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:col-span-4">
          <div className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm sm:p-6">
            <PanelHeader
              eyebrow="Collections"
              title="Recent payment activity"
              description="Latest rent, water, and tax payment signals across the organization."
            />

            <div className="mt-5 space-y-3">
              {recentPayments.length === 0 ? (
                <EmptyState
                  title="No payment activity yet"
                  message="Confirmed and pending collections will show here once they arrive."
                />
              ) : (
                recentPayments.map((payment) => (
                  <article
                    key={payment.id}
                    className="rounded-3xl border border-black/5 bg-neutral-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-neutral-700 ring-1 ring-black/5">
                        <CreditCard className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="truncate text-sm font-semibold text-neutral-950">
                              {payment.payerTenant.fullName}
                            </p>
                            <p className="mt-1 text-sm text-neutral-500">
                              {getPaymentLabel(payment)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-neutral-950">
                            {formatMoney(
                              toNumber(payment.amount),
                              membership.org.currencyCode,
                            )}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <PaymentStatusBadge
                            gatewayStatus={payment.gatewayStatus}
                            verificationStatus={payment.verificationStatus}
                          />
                          <span className="text-xs text-neutral-500">
                            {formatEnumLabel(payment.method)}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                          <span>
                            {formatDateTime(
                              payment.paidAt ?? payment.createdAt,
                              membership.org.timezone,
                            )}
                          </span>
                          {(payment.reference || payment.externalReference) && (
                            <>
                              <span>•</span>
                              <span className="truncate">
                                Ref: {payment.reference ?? payment.externalReference}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-black/10 bg-neutral-950 p-5 text-white shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Snapshot</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">Operations at a glance</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {approvalQueue.length > 0
                ? `${approvalQueue.length} approvals are waiting for action. Prioritize submitted readings to keep billing current.`
                : "No pending water approvals right now. The queue is clear."}
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/50">Delivery health</p>
                <p className="mt-1 text-2xl font-semibold">{sentCount}</p>
                <p className="mt-1 text-sm text-white/65">
                  successful sends in the current feed
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/50">Attention needed</p>
                <p className="mt-1 text-2xl font-semibold">{failedCount + unreadCount}</p>
                <p className="mt-1 text-sm text-white/65">failed or unread items to review</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}