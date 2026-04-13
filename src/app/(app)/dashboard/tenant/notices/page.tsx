import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { Prisma, NoticeStatus, NotificationStatus } from "@prisma/client";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Megaphone,
  Send,
} from "lucide-react";

const tenantNoticesArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
        status: "ACTIVE",
      },
      orderBy: {
        startDate: "desc",
      },
      take: 1,
      include: {
        unit: {
          include: {
            property: true,
            building: true,
          },
        },
      },
    },
    notifications: {
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    },
    moveOutNotices: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: true,
                building: true,
              },
            },
          },
        },
        inspection: true,
      },
      take: 50,
    },
  },
});

type TenantNoticesResult = Prisma.TenantGetPayload<typeof tenantNoticesArgs>;

type TenantNoticesPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getNotificationStatusClasses(status: NotificationStatus) {
  switch (status) {
    case "SENT":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "QUEUED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function getMoveOutStatusClasses(status: NoticeStatus) {
  switch (status) {
    case "SUBMITTED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "INSPECTION_SCHEDULED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "INSPECTION_COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CLOSED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "CANCELLED":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function getErrorMessage(error?: string) {
  switch (error) {
    case "missing_move_out_date":
      return "Please select your intended move-out date.";
    case "no_active_lease":
      return "You need an active lease to submit a move-out notice.";
    case "invalid_move_out_date":
      return "Move-out date must be today or later.";
    case "duplicate_open_notice":
      return "You already have an active move-out notice for this lease.";
    default:
      return null;
  }
}

function getSuccessMessage(success?: string) {
  switch (success) {
    case "notice_submitted":
      return "Your move-out notice has been submitted successfully.";
    default:
      return null;
  }
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        {children}
      </div>
    </div>
  );
}

function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-black/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-[#fafafa] p-4">
      <div className="flex items-center gap-2 text-neutral-500">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
          {icon}
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-[15px] font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function EmptySection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] bg-[#fafafa] p-4 text-center">
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  );
}

export default async function TenantNoticesPage({
  searchParams,
}: TenantNoticesPageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const errorMessage = getErrorMessage(resolvedSearchParams.error);
  const successMessage = getSuccessMessage(resolvedSearchParams.success);

  const tenant: TenantNoticesResult | null = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    ...tenantNoticesArgs,
  });

  if (!tenant) {
    return (
      <PageShell>
        <SurfaceCard className="p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
            Notices
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Tenant profile not found.
          </p>
        </SurfaceCard>
      </PageShell>
    );
  }

  const activeLease = tenant.leases[0] ?? null;
  const activeUnit = activeLease?.unit ?? null;

  async function submitMoveOutNotice(formData: FormData) {
    "use server";

    const session = await requireTenantAccess();

    if (!session.userId) {
      throw new Error("Missing user id in session");
    }

    if (!session.activeOrgId) {
      throw new Error("Missing active organization id in session");
    }

    const moveOutDateRaw = String(formData.get("moveOutDate") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!moveOutDateRaw) {
      redirect("/dashboard/tenant/notices?error=missing_move_out_date");
    }

    const tenant = await prisma.tenant.findFirst({
      where: {
        userId: session.userId,
        orgId: session.activeOrgId,
        deletedAt: null,
      },
      include: {
        leases: {
          where: {
            deletedAt: null,
            status: "ACTIVE",
          },
          orderBy: {
            startDate: "desc",
          },
          take: 1,
        },
      },
    });

    const activeLease = tenant?.leases[0];

    if (!tenant || !activeLease) {
      redirect("/dashboard/tenant/notices?error=no_active_lease");
    }

    const moveOutDate = new Date(moveOutDateRaw);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(moveOutDate.getTime()) || moveOutDate < today) {
      redirect("/dashboard/tenant/notices?error=invalid_move_out_date");
    }

    const existingNotice = await prisma.moveOutNotice.findFirst({
      where: {
        leaseId: activeLease.id,
        tenantId: tenant.id,
        status: {
          in: ["SUBMITTED", "INSPECTION_SCHEDULED", "INSPECTION_COMPLETED"],
        },
      },
    });

    if (existingNotice) {
      redirect("/dashboard/tenant/notices?error=duplicate_open_notice");
    }

    await prisma.moveOutNotice.create({
      data: {
        leaseId: activeLease.id,
        tenantId: tenant.id,
        moveOutDate,
        notes: notes || null,
      },
    });

    revalidatePath("/dashboard/tenant/notices");
    revalidatePath("/dashboard/tenant/inspections");
    redirect("/dashboard/tenant/notices?success=notice_submitted");
  }

  const notifications = tenant.notifications;
  const moveOutNotices = tenant.moveOutNotices;

  const queuedNotifications = notifications.filter(
    (notification) => notification.status === "QUEUED"
  ).length;

  const sentNotifications = notifications.filter(
    (notification) => notification.status === "SENT"
  ).length;

  const activeMoveOutNotices = moveOutNotices.filter((notice) =>
    ["SUBMITTED", "INSPECTION_SCHEDULED", "INSPECTION_COMPLETED"].includes(
      notice.status
    )
  ).length;

  const closedMoveOutNotices = moveOutNotices.filter((notice) =>
    ["CLOSED", "CANCELLED"].includes(notice.status)
  ).length;

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <SurfaceCard className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Tenant Notices
              </p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
                Notices
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                View notices sent to you and submit your own move-out notice from
                one place.
              </p>
            </div>

            {activeUnit ? (
              <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Current Unit
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-950">
                  {activeUnit.property.name} — {activeUnit.houseNo}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {activeUnit.building?.name ?? "No building"}
                </p>
              </div>
            ) : (
              <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Lease Status
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-950">
                  No active lease
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  Move-out notices require an active lease
                </p>
              </div>
            )}
          </div>
        </SurfaceCard>

        {successMessage ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
          <StatCard
            icon={<Bell className="h-4 w-4" />}
            label="All Notices"
            value={notifications.length}
          />
          <StatCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Queued"
            value={queuedNotifications}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Sent"
            value={sentNotifications}
          />
          <StatCard
            icon={<Megaphone className="h-4 w-4" />}
            label="Given Notices"
            value={moveOutNotices.length}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
                Received Notices
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Notifications sent to your tenant account. Notifications belong
                directly to the tenant in your schema.
              </p>
            </div>

            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-[20px] border border-black/5 bg-[#fafafa] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-950">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {notification.type.replaceAll("_", " ")} •{" "}
                          {notification.channel.replaceAll("_", " ")}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getNotificationStatusClasses(
                          notification.status
                        )}`}
                      >
                        {notification.status}
                      </span>
                    </div>

                    <div className="mt-3 rounded-[16px] bg-white px-3 py-3">
                      <p className="text-sm text-neutral-700">
                        {notification.message}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-[16px] bg-white px-3 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                          Created
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-950">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>

                      <div className="rounded-[16px] bg-white px-3 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                          Read
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-950">
                          {formatDateTime(notification.readAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptySection
                  title="No received notices"
                  description="You do not have any tenant notifications yet."
                />
              )}
            </div>
          </SurfaceCard>

          <div className="space-y-4">
            <SurfaceCard className="p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
                  Give Notice
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Submit a move-out notice. In your schema, giving notice means
                  creating a MoveOutNotice for your active lease.
                </p>
              </div>

              {activeLease ? (
                <form action={submitMoveOutNotice} className="space-y-4">
                  <div>
                    <label
                      htmlFor="moveOutDate"
                      className="mb-2 block text-sm font-medium text-neutral-700"
                    >
                      Intended move-out date
                    </label>
                    <input
                      id="moveOutDate"
                      name="moveOutDate"
                      type="date"
                      required
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="mb-2 block text-sm font-medium text-neutral-700"
                    >
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      maxLength={1000}
                      placeholder="Add any move-out details or requests."
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit Notice
                  </button>
                </form>
              ) : (
                <EmptySection
                  title="No active lease"
                  description="You need an active lease before you can submit a move-out notice."
                />
              )}
            </SurfaceCard>

            <SurfaceCard className="p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
                  Given Notices
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Your submitted move-out notices and their progress.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Active"
                  value={activeMoveOutNotices}
                />
                <StatCard
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Closed"
                  value={closedMoveOutNotices}
                />
              </div>

              <div className="mt-4 space-y-3">
                {moveOutNotices.length > 0 ? (
                  moveOutNotices.map((notice) => (
                    <div
                      key={notice.id}
                      className="rounded-[20px] border border-black/5 bg-[#fafafa] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-950">
                            {notice.lease.unit.property.name} • Unit{" "}
                            {notice.lease.unit.houseNo}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            Notice date: {formatDate(notice.noticeDate)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getMoveOutStatusClasses(
                            notice.status
                          )}`}
                        >
                          {notice.status.replaceAll("_", " ")}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-[16px] bg-white px-3 py-3">
                          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                            Move-Out Date
                          </p>
                          <p className="mt-1 text-sm font-semibold text-neutral-950">
                            {formatDate(notice.moveOutDate)}
                          </p>
                        </div>

                        <div className="rounded-[16px] bg-white px-3 py-3">
                          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                            Inspection
                          </p>
                          <p className="mt-1 text-sm font-semibold text-neutral-950">
                            {notice.inspection
                              ? formatDateTime(notice.inspection.scheduledAt)
                              : "Not scheduled"}
                          </p>
                        </div>
                      </div>

                      {notice.notes ? (
                        <div className="mt-3 rounded-[16px] bg-white px-3 py-3">
                          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                            Notes
                          </p>
                          <p className="mt-1 text-sm text-neutral-700">
                            {notice.notes}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <EmptySection
                    title="No submitted notices"
                    description="You have not submitted any move-out notices yet."
                  />
                )}
              </div>
            </SurfaceCard>
          </div>
        </section>
      </div>
    </PageShell>
  );
}