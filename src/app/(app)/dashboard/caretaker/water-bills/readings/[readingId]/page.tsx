import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ readingId: string }>;
};

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

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "SUBMITTED"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-neutral-200 bg-neutral-100 text-neutral-700";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}

export default async function ReadingDetailPage({ params }: PageProps) {
  const { readingId } = await params;

  const reading = await prisma.meterReading.findUnique({
    where: {
      id: readingId,
    },
    include: {
      unit: {
        select: {
          houseNo: true,
          building: {
            select: {
              name: true,
            },
          },
          property: {
            select: {
              name: true,
            },
          },
          leases: {
            where: {
              status: "ACTIVE",
            },
            take: 1,
            select: {
              tenant: {
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

  if (!reading) notFound();

  return (
    <div className="space-y-5 sm:space-y-6">
      <Link
        href="/dashboard/caretaker/water-bills"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to water bills
      </Link>

      <section className="rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-500">Meter reading</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
              House {reading.unit.houseNo}
            </h1>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {reading.unit.property.name} · {reading.unit.building?.name ?? "No building"} ·{" "}
              {reading.unit.leases[0]?.tenant.fullName ?? "No tenant assigned"}
            </p>
          </div>

          <StatusBadge status={reading.status} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Previous reading
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {reading.prevReading}
          </p>
        </div>

        <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Current reading
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {reading.currentReading}
          </p>
        </div>

        <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Units used
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {reading.unitsUsed}
          </p>
        </div>
      </section>

      <section className="rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
          Workflow details
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-500">Period</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {reading.period}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-500">Approved at</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {formatDate(reading.approvedAt)}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-500">Created at</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {formatDate(reading.createdAt)}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-sm font-medium text-neutral-500">Updated at</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {formatDate(reading.updatedAt)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}