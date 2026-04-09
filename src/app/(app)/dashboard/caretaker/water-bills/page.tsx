import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Droplets,
  Send,
} from "lucide-react";

export const dynamic = "force-dynamic";

const CURRENT_PERIOD = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
}).format(new Date());

function toNumber(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

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

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[24px] border border-neutral-200/80 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "neutral",
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "amber" | "blue" | "green";
}) {
  const toneMap = {
    neutral: "bg-neutral-100 text-neutral-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-500">{subtitle}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneMap[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  tone,
  pulse = false,
}: {
  label: string;
  tone: "red" | "blue" | "green" | "neutral" | "violet";
  pulse?: boolean;
}) {
  const toneMap = {
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    neutral: "border-neutral-200 bg-neutral-100 text-neutral-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneMap[tone]} ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      {label}
    </span>
  );
}

function ReadWaterBillsCard({
  pendingCount,
}: {
  pendingCount: number;
}) {
  return (
    <Link
      href="/dashboard/caretaker/water-bills/read"
      className="group block rounded-[24px] border border-neutral-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          <Droplets className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Caretaker action
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                Read Water Bills
              </h1>
            </div>

            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-neutral-400 transition group-hover:text-neutral-700" />
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
            Record previous and current meter units, submit readings to office
            for approval, then let approved readings move to tenant billing.
          </p>

          <div className="mt-4">
            <StatusBadge
              label={`${pendingCount} apartments still need submission`}
              tone="red"
              pulse={pendingCount > 0}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function MeterReadingCard({
  href,
  property,
  building,
  houseNo,
  tenant,
  previousReading,
  currentReading,
  unitsUsed,
  status,
  period,
  submittedAt,
}: {
  href: string;
  property: string;
  building: string;
  houseNo: string;
  tenant: string;
  previousReading: number | string;
  currentReading: number | string | null;
  unitsUsed: number | string | null;
  status: "NOT_SUBMITTED" | "SUBMITTED" | "APPROVED";
  period: string;
  submittedAt?: string;
}) {
  const isPendingSubmission = status === "NOT_SUBMITTED";

  return (
    <Link
      href={href}
      className="block rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            {property} · {building}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {tenant} · Period {period}
          </p>
        </div>

        <StatusBadge
          label={`House ${houseNo}`}
          tone={
            status === "NOT_SUBMITTED"
              ? "red"
              : status === "SUBMITTED"
                ? "blue"
                : "green"
          }
          pulse={isPendingSubmission}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Previous
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {previousReading}
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Current
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {currentReading ?? "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Units Used
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {unitsUsed ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-neutral-500">
          {status === "NOT_SUBMITTED" && "Pending caretaker submission"}
          {status === "SUBMITTED" &&
            `Submitted to office${submittedAt ? ` · ${submittedAt}` : ""}`}
          {status === "APPROVED" && "Approved by office"}
        </div>

        <span className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900">
          {status === "NOT_SUBMITTED" ? "Enter readings" : "Open"}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

type UnitWithLease = {
  id: string;
  houseNo: string;
  building: { name: string } | null;
  property: {
    id: string;
    name: string;
  };
  leases: Array<{
    tenant: {
      id: string;
      fullName: string;
    };
  }>;
};

export default async function WaterBillsPage() {
  const [units, meterReadings, waterBills] = await Promise.all([
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
            id: true,
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
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    }),

    prisma.meterReading.findMany({
      where: {
        period: CURRENT_PERIOD,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        unit: {
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
                id: true,
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
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    }),

    prisma.waterBill.findMany({
      where: {
        period: CURRENT_PERIOD,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tenant: {
          select: {
            id: true,
            fullName: true,
          },
        },
        unit: {
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
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const billMap = new Map(waterBills.map((bill) => [bill.unitId, bill]));

  const pendingUnits = (units as UnitWithLease[])
    .filter((unit) => {
      const reading = meterReadings.find((r) => r.unitId === unit.id);
      return !reading;
    })
    .map((unit) => ({
      id: unit.id,
      property: unit.property.name,
      building: unit.building?.name ?? "No building",
      houseNo: unit.houseNo,
      tenant: unit.leases[0]?.tenant.fullName ?? "No tenant assigned",
      previousReading: "—",
      currentReading: null,
      unitsUsed: null,
      period: CURRENT_PERIOD,
    }));

  const submittedReadings = meterReadings
    .filter((reading) => reading.status === "SUBMITTED" && !billMap.has(reading.unitId))
    .map((reading) => ({
      id: reading.id,
      property: reading.unit.property.name,
      building: reading.unit.building?.name ?? "No building",
      houseNo: reading.unit.houseNo,
      tenant: reading.unit.leases[0]?.tenant.fullName ?? "No tenant assigned",
      previousReading: reading.prevReading,
      currentReading: reading.currentReading,
      unitsUsed: reading.unitsUsed,
      period: reading.period,
      submittedAt: formatDate(reading.createdAt),
    }));

  const approvedReadings = meterReadings
    .filter((reading) => reading.status === "APPROVED" && !billMap.has(reading.unitId))
    .map((reading) => ({
      id: reading.id,
      property: reading.unit.property.name,
      building: reading.unit.building?.name ?? "No building",
      houseNo: reading.unit.houseNo,
      tenant: reading.unit.leases[0]?.tenant.fullName ?? "No tenant assigned",
      previousReading: reading.prevReading,
      currentReading: reading.currentReading,
      unitsUsed: reading.unitsUsed,
      period: reading.period,
      submittedAt: formatDate(reading.approvedAt),
    }));

  const issuedBills = waterBills.map((bill) => ({
    id: bill.id,
    property: bill.unit.property.name,
    building: bill.unit.building?.name ?? "No building",
    houseNo: bill.unit.houseNo,
    tenant: bill.tenant.fullName,
    unitsUsed: bill.unitsUsed,
    total: bill.total,
    dueDate: formatDate(bill.dueDate),
    period: bill.period,
  }));

  const totalBilled = waterBills.reduce(
    (sum, bill) => sum + toNumber(bill.total),
    0
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <ReadWaterBillsCard pendingCount={pendingUnits.length} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Pending Reading"
          value={pendingUnits.length}
          subtitle="Occupied apartments that still need meter entry."
          icon={AlertCircle}
          tone="amber"
        />
        <SummaryCard
          title="Awaiting Approval"
          value={submittedReadings.length}
          subtitle="Submitted readings waiting for office review."
          icon={Clock3}
          tone="blue"
        />
        <SummaryCard
          title="Approved"
          value={approvedReadings.length}
          subtitle="Office-approved readings ready for billing."
          icon={CheckCircle2}
          tone="green"
        />
        <SummaryCard
          title="Sent to Tenant"
          value={issuedBills.length}
          subtitle={`Bills issued this period · ${formatCurrency(totalBilled)}`}
          icon={Send}
          tone="neutral"
        />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium text-neutral-500">Needs submission</p>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Apartments pending readings
          </h2>
        </div>

        {pendingUnits.length === 0 ? (
          <SectionCard className="p-6 text-sm text-neutral-500">
            All occupied apartments have readings submitted for {CURRENT_PERIOD}.
          </SectionCard>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {pendingUnits.map((unit) => (
              <MeterReadingCard
                key={unit.id}
                href={`/dashboard/caretaker/water-bills/read/${unit.id}?period=${CURRENT_PERIOD}`}
                property={unit.property}
                building={unit.building}
                houseNo={unit.houseNo}
                tenant={unit.tenant}
                previousReading={unit.previousReading}
                currentReading={unit.currentReading}
                unitsUsed={unit.unitsUsed}
                status="NOT_SUBMITTED"
                period={unit.period}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Awaiting office approval
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                Submitted readings
              </h2>
            </div>
            <StatusBadge label="Submitted" tone="blue" />
          </div>

          <div className="mt-4 space-y-3">
            {submittedReadings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
                No submitted readings are waiting for approval.
              </div>
            ) : (
              submittedReadings.map((reading) => (
                <MeterReadingCard
                  key={reading.id}
                  href={`/dashboard/caretaker/water-bills/readings/${reading.id}`}
                  property={reading.property}
                  building={reading.building}
                  houseNo={reading.houseNo}
                  tenant={reading.tenant}
                  previousReading={reading.previousReading}
                  currentReading={reading.currentReading}
                  unitsUsed={reading.unitsUsed}
                  status="SUBMITTED"
                  period={reading.period}
                  submittedAt={reading.submittedAt}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Approved readings
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                Ready for tenant billing
              </h2>
            </div>
            <StatusBadge label="Approved" tone="green" />
          </div>

          <div className="mt-4 space-y-3">
            {approvedReadings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
                No approved readings are waiting for billing.
              </div>
            ) : (
              approvedReadings.map((reading) => (
                <MeterReadingCard
                  key={reading.id}
                  href={`/dashboard/caretaker/water-bills/readings/${reading.id}`}
                  property={reading.property}
                  building={reading.building}
                  houseNo={reading.houseNo}
                  tenant={reading.tenant}
                  previousReading={reading.previousReading}
                  currentReading={reading.currentReading}
                  unitsUsed={reading.unitsUsed}
                  status="APPROVED"
                  period={reading.period}
                  submittedAt={reading.submittedAt}
                />
              ))
            )}
          </div>
        </SectionCard>
      </section>

      <SectionCard className="overflow-hidden">
        <div className="border-b border-neutral-200/80 px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                Tenant billing
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                Bills already sent to tenants
              </h2>
            </div>
            <StatusBadge label="Issued bills" tone="violet" />
          </div>
        </div>

        {issuedBills.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No tenant water bills have been issued for {CURRENT_PERIOD}.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 xl:grid-cols-2">
            {issuedBills.map((bill) => (
              <div
                key={bill.id}
                className="rounded-[22px] border border-neutral-200/80 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      {bill.property} · {bill.building}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {bill.tenant} · Period {bill.period}
                    </p>
                  </div>

                  <StatusBadge label={`House ${bill.houseNo}`} tone="violet" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      Units Used
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">
                      {bill.unitsUsed}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-neutral-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      Total
                    </p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">
                      {formatCurrency(bill.total)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-neutral-500">Due: {bill.dueDate}</p>

                  <Link
                    href={`/dashboard/caretaker/water-bills/bills/${bill.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900"
                  >
                    Open bill
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}