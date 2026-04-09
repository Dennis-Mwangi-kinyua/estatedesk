import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Droplets } from "lucide-react";

export const dynamic = "force-dynamic";

const CURRENT_PERIOD = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
}).format(new Date());

type SearchParams = Promise<{
  period?: string;
}>;

function StatusPill({
  children,
  pulse = false,
}: {
  children: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      {children}
    </span>
  );
}

export default async function ReadWaterBillsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const period = params.period ?? CURRENT_PERIOD;

  const [units, meterReadings] = await Promise.all([
    prisma.unit.findMany({
      where: {
        isActive: true,
        status: "OCCUPIED",
        leases: {
          some: {
            status: "ACTIVE",
          },
        },
      },
      orderBy: [{ property: { name: "asc" } }, { houseNo: "asc" }],
      select: {
        id: true,
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
    }),
    prisma.meterReading.findMany({
      where: {
        period,
      },
      select: {
        id: true,
        unitId: true,
      },
    }),
  ]);

  const existingReadingUnitIds = new Set(meterReadings.map((r) => r.unitId));
  const pendingUnits = units.filter((unit) => !existingReadingUnitIds.has(unit.id));

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <Droplets className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-500">Caretaker action</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
              Read Water Bills
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Select an apartment, enter previous and current meter readings,
              then submit the reading to office for approval.
            </p>

            <div className="mt-4">
              <StatusPill pulse>
                {pendingUnits.length} apartments still need reading
              </StatusPill>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Pending readings</p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Apartments without submitted readings
          </h2>
        </div>

        {pendingUnits.length === 0 ? (
          <div className="rounded-[24px] border border-neutral-200/80 bg-white p-6 text-sm text-neutral-500 shadow-sm">
            All occupied apartments already have readings for {period}.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {pendingUnits.map((unit) => (
              <Link
                key={unit.id}
                href={`/dashboard/caretaker/water-bills/read/${unit.id}?period=${period}`}
                className="block rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      {unit.property.name} · {unit.building?.name ?? "No building"}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {unit.leases[0]?.tenant.fullName ?? "No tenant assigned"}
                    </p>
                  </div>

                  <StatusPill pulse>House {unit.houseNo}</StatusPill>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      Previous
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">—</p>
                  </div>

                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      Current
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">—</p>
                  </div>

                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      Units Used
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">—</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-red-600">
                    Not yet submitted for approval
                  </p>

                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    Enter readings
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}