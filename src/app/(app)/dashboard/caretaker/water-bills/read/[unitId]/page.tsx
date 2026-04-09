import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MeterReadingForm } from "./meter-reading-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ unitId: string }>;
  searchParams: Promise<{ period?: string }>;
};

const CURRENT_PERIOD = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
}).format(new Date());

export default async function ReadSingleWaterBillPage({
  params,
  searchParams,
}: PageProps) {
  const { unitId } = await params;
  const { period } = await searchParams;
  const currentPeriod = period ?? CURRENT_PERIOD;

  const [unit, existingReading] = await Promise.all([
    prisma.unit.findUnique({
      where: { id: unitId },
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
            waterRatePerUnit: true,
            waterFixedCharge: true,
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
    prisma.meterReading.findUnique({
      where: {
        unitId_period: {
          unitId,
          period: currentPeriod,
        },
      },
      select: {
        id: true,
        prevReading: true,
        currentReading: true,
        unitsUsed: true,
        status: true,
      },
    }),
  ]);

  if (!unit) notFound();

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm font-medium text-neutral-500">Meter entry</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
          House {unit.houseNo}
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500">
          {unit.property.name} · {unit.building?.name ?? "No building"} ·{" "}
          {unit.leases[0]?.tenant.fullName ?? "No tenant assigned"}
        </p>
        <p className="mt-1 text-sm text-neutral-500">Period: {currentPeriod}</p>
      </section>

      {existingReading ? (
        <section className="rounded-[24px] border border-sky-200 bg-sky-50 p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-sky-900">
            Reading already submitted
          </h2>
          <p className="mt-2 text-sm leading-6 text-sky-800">
            A reading for this unit and period already exists.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-medium text-sky-700">Previous</p>
              <p className="mt-2 text-xl font-semibold text-neutral-900">
                {existingReading.prevReading}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-medium text-sky-700">Current</p>
              <p className="mt-2 text-xl font-semibold text-neutral-900">
                {existingReading.currentReading}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-medium text-sky-700">Units used</p>
              <p className="mt-2 text-xl font-semibold text-neutral-900">
                {existingReading.unitsUsed}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-medium text-sky-700">Status</p>
              <p className="mt-2 text-xl font-semibold text-neutral-900">
                {existingReading.status}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
          <MeterReadingForm unitId={unit.id} period={currentPeriod} />
        </section>
      )}
    </div>
  );
}