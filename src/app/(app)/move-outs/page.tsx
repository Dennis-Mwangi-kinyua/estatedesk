import Link from "next/link";
import { revalidatePath } from "next/cache";
import { OrgRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { encodePublicId } from "@/lib/public-id";
import { recordVacatedTenancy } from "@/lib/tenants/identity";
import { notifyInAppAndPush } from "@/lib/notifications/notify";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function scheduleInspectionAction(formData: FormData) {
  "use server";

  const session = await requireManagementAccess();
  const noticeId = String(formData.get("noticeId") ?? "").trim();
  const inspectorUserId = String(formData.get("inspectorUserId") ?? "").trim();
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim();

  if (!noticeId || !inspectorUserId || !scheduledAtRaw) {
    throw new Error("Notice, inspector, and scheduled time are required.");
  }

  const scheduledAt = new Date(scheduledAtRaw);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Inspection date is invalid.");
  }

  await prisma.$transaction(async (tx) => {
    const notice = await tx.moveOutNotice.findFirst({
      where: {
        id: noticeId,
        status: "SUBMITTED",
        lease: {
          orgId: session.activeOrgId!,
        },
      },
      select: {
        id: true,
        inspection: {
          select: { id: true },
        },
      },
    });

    if (!notice || notice.inspection) {
      throw new Error("This move-out notice cannot be scheduled.");
    }

    const inspector = await tx.membership.findFirst({
      where: {
        orgId: session.activeOrgId!,
        userId: inspectorUserId,
        role: {
          in: [OrgRole.CARETAKER, OrgRole.MANAGER, OrgRole.OFFICE, OrgRole.ADMIN],
        },
        user: {
          deletedAt: null,
        },
      },
      select: { userId: true },
    });

    if (!inspector) {
      throw new Error("Selected inspector is not available in this organisation.");
    }

    await tx.inspection.create({
      data: {
        noticeId: notice.id,
        inspectorUserId,
        scheduledAt,
        status: "SCHEDULED",
      },
    });

    await tx.moveOutNotice.update({
      where: { id: notice.id },
      data: { status: "INSPECTION_SCHEDULED" },
    });

    await tx.auditLog.create({
      data: {
        orgId: session.activeOrgId!,
        actorUserId: session.userId,
        action: "INSPECTION_SCHEDULED",
        entityType: "MoveOutNotice",
        entityId: notice.id,
        metadata: {
          inspectorUserId,
          scheduledAt: scheduledAt.toISOString(),
        },
      },
    });
  });

  revalidatePath("/move-outs");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/dashboard/caretaker/inspections");
  revalidatePath("/dashboard/tenant/inspections");
}

async function closeMoveOutAction(formData: FormData) {
  "use server";

  const session = await requireManagementAccess();
  const noticeId = String(formData.get("noticeId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!noticeId) {
    throw new Error("Move-out notice is required.");
  }

  await prisma.$transaction(async (tx) => {
    const notice = await tx.moveOutNotice.findFirst({
      where: {
        id: noticeId,
        status: "INSPECTION_COMPLETED",
        lease: {
          orgId: session.activeOrgId!,
        },
      },
      select: {
        id: true,
        tenantId: true,
        leaseId: true,
        tenant: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!notice) {
      throw new Error("Only inspection-completed move-outs can be closed.");
    }

    await tx.moveOutNotice.update({
      where: { id: notice.id },
      data: {
        status: "CLOSED",
        notes: notes || undefined,
      },
    });

    await recordVacatedTenancy(tx, {
      tenantId: notice.tenantId,
      leaseId: notice.leaseId,
      moveOutNoticeId: notice.id,
      actorUserId: session.userId,
      notes: notes || "Move-out confirmed by organization.",
    });

    await tx.tenantHistoryRecord.updateMany({
      where: {
        tenantId: notice.tenantId,
        leaseId: notice.leaseId,
        moveOutNoticeId: notice.id,
      },
      data: {
        status: "ARCHIVED",
        notes: notes || undefined,
      },
    });

    await notifyInAppAndPush({ db: tx, orgId: session.activeOrgId!, recipients: [{ tenantId: notice.tenantId }], type: "MOVE_OUT_CLOSED", title: "Move-out closed", message: `Move-out closeout for ${notice.tenant.fullName} has been completed.${notes ? ` Notes: ${notes}` : ""}` });

    await tx.auditLog.create({
      data: {
        orgId: session.activeOrgId!,
        actorUserId: session.userId,
        action: "MOVE_OUT_CLOSED",
        entityType: "MoveOutNotice",
        entityId: notice.id,
        metadata: {
          notes,
        },
      },
    });
  });

  revalidatePath("/move-outs");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/dashboard/org/verify-tenant");
  revalidatePath("/dashboard/org/units");
  revalidatePath("/dashboard/org/properties");
  revalidatePath("/dashboard/org/tenants");
  revalidatePath("/dashboard/tenant");
}

export default async function MoveOutsPage() {
  const session = await requireManagementAccess();

  const [notices, inspectors] = await Promise.all([
    prisma.moveOutNotice.findMany({
      where: {
        lease: {
          orgId: session.activeOrgId!,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tenant: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            status: true,
          },
        },
        lease: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            unit: {
              select: {
                id: true,
                houseNo: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                building: {
                  select: {
                    id: true,
                    name: true,
                  },
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
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    }),
    prisma.membership.findMany({
      where: {
        orgId: session.activeOrgId!,
        role: {
          in: [OrgRole.CARETAKER, OrgRole.MANAGER, OrgRole.OFFICE, OrgRole.ADMIN],
        },
        user: {
          deletedAt: null,
        },
      },
      distinct: ["userId"],
      orderBy: {
        createdAt: "asc",
      },
      select: {
        userId: true,
        role: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    }),
  ]);

  const totalNotices = notices.length;
  const submittedCount = notices.filter((n) => n.status === "SUBMITTED").length;
  const scheduledCount = notices.filter(
    (n) => n.status === "INSPECTION_SCHEDULED"
  ).length;
  const completedCount = notices.filter(
    (n) => n.status === "INSPECTION_COMPLETED"
  ).length;
  const closedCount = notices.filter((n) => n.status === "CLOSED").length;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Move-outs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track tenant move-out notices and inspections.
          </p>
        </div>

        <Link
          href="/dashboard/org/notifications?filter=moveouts"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          View move-out queue
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Notices</p>
          <p className="mt-2 text-2xl font-semibold">{totalNotices}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Submitted</p>
          <p className="mt-2 text-2xl font-semibold">{submittedCount}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Inspection Scheduled</p>
          <p className="mt-2 text-2xl font-semibold">{scheduledCount}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Inspection Completed</p>
          <p className="mt-2 text-2xl font-semibold">{completedCount}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Closed</p>
          <p className="mt-2 text-2xl font-semibold">{closedCount}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">All Move-out Notices</h2>
        </div>

        {notices.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No move-out notices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Notice Date</th>
                  <th className="px-4 py-3 font-medium">Move-out Date</th>
                  <th className="px-4 py-3 font-medium">Notice Status</th>
                  <th className="px-4 py-3 font-medium">Inspection</th>
                  <th className="px-4 py-3 font-medium">Inspector</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {notice.tenant.fullName}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/properties/${notice.lease.unit.property.id}`}
                        className="underline underline-offset-4"
                      >
                        {notice.lease.unit.property.name}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      {notice.lease.unit.building?.name ?? "—"}
                    </td>

                    <td className="px-4 py-3">{notice.lease.unit.houseNo}</td>

                    <td className="px-4 py-3">
                      {formatDate(notice.noticeDate)}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(notice.moveOutDate)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                        {notice.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {notice.inspection
                        ? `${notice.inspection.status} • ${formatDateTime(
                            notice.inspection.scheduledAt
                          )}`
                        : "Not scheduled"}
                    </td>

                    <td className="px-4 py-3">
                      {notice.inspection?.inspector.fullName ?? "—"}
                    </td>

                    <td className="min-w-[340px] px-4 py-3">
                      {!notice.inspection && notice.status === "SUBMITTED" ? (
                        inspectors.length > 0 ? (
                          <form
                            action={scheduleInspectionAction}
                            className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                          >
                            <input
                              type="hidden"
                              name="noticeId"
                              value={notice.id}
                            />
                            <input
                              type="datetime-local"
                              name="scheduledAt"
                              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-primary"
                              required
                            />
                            <select
                              name="inspectorUserId"
                              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-primary"
                              required
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Inspector
                              </option>
                              {inspectors.map((inspector) => (
                                <option
                                  key={`${inspector.userId}-${inspector.role}`}
                                  value={inspector.userId}
                                >
                                  {inspector.user.fullName} ({inspector.role})
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                            >
                              Schedule
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Add a caretaker or manager before scheduling.
                          </span>
                        )
                      ) : notice.inspection ? (
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/dashboard/org/inspections/${encodePublicId(
                              notice.inspection.id,
                              "inspection",
                            )}`}
                            className="text-xs font-semibold text-primary hover:text-primary/80"
                          >
                            Open report
                          </Link>
                          {notice.status === "INSPECTION_COMPLETED" ? (
                            <form
                              action={closeMoveOutAction}
                              className="grid gap-2 sm:grid-cols-[1fr_auto]"
                            >
                              <input
                                type="hidden"
                                name="noticeId"
                                value={notice.id}
                              />
                              <input
                                name="notes"
                                placeholder="Closeout notes"
                                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-primary"
                              />
                              <button
                                type="submit"
                                className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
                              >
                                Close
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No action
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
