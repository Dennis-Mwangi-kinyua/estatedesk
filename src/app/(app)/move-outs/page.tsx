import Link from "next/link";
import { prisma } from "@/lib/prisma";

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

export default async function MoveOutsPage() {
  const notices = await prisma.moveOutNotice.findMany({
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
  });

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
          href="/inspections"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          View Inspections
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