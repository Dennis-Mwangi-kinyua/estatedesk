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

export default async function InspectionsPage() {
  const inspections = await prisma.inspection.findMany({
    orderBy: {
      scheduledAt: "desc",
    },
    include: {
      inspector: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          status: true,
        },
      },
      notice: {
        select: {
          id: true,
          noticeDate: true,
          moveOutDate: true,
          status: true,
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
        },
      },
    },
  });

  const totalInspections = inspections.length;
  const scheduledInspections = inspections.filter(
    (inspection) => inspection.status === "SCHEDULED"
  ).length;
  const completedInspections = inspections.filter(
    (inspection) => inspection.status === "COMPLETED"
  ).length;
  const cancelledInspections = inspections.filter(
    (inspection) => inspection.status === "CANCELLED"
  ).length;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Inspections</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and manage move-out inspections.
          </p>
        </div>

        <Link
          href="/move-outs"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          View Move-outs
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Inspections</p>
          <p className="mt-2 text-2xl font-semibold">{totalInspections}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Scheduled</p>
          <p className="mt-2 text-2xl font-semibold">{scheduledInspections}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="mt-2 text-2xl font-semibold">{completedInspections}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Cancelled</p>
          <p className="mt-2 text-2xl font-semibold">{cancelledInspections}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">All Inspections</h2>
        </div>

        {inspections.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No inspections found.
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
                  <th className="px-4 py-3 font-medium">Inspector</th>
                  <th className="px-4 py-3 font-medium">Scheduled</th>
                  <th className="px-4 py-3 font-medium">Move-out Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((inspection) => (
                  <tr key={inspection.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {inspection.notice.tenant.fullName}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/properties/${inspection.notice.lease.unit.property.id}`}
                        className="underline underline-offset-4"
                      >
                        {inspection.notice.lease.unit.property.name}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      {inspection.notice.lease.unit.building?.name ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {inspection.notice.lease.unit.houseNo}
                    </td>

                    <td className="px-4 py-3">{inspection.inspector.fullName}</td>

                    <td className="px-4 py-3">
                      {formatDateTime(inspection.scheduledAt)}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(inspection.notice.moveOutDate)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                        {inspection.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {formatDateTime(inspection.completedAt)}
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