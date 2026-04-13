import Link from "next/link";
import { Plus, Building2, Users, Wallet, TrendingUp } from "lucide-react";
import { PropertiesGrid } from "@/features/properties/components/properties-grid";
import { PropertiesCarousel } from "@/features/properties/components/properties-carousel";
import { getProperties } from "@/features/properties/queries/get-properties";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPropertyType(value: string | null | undefined) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPropertyStatus(isActive: boolean | null | undefined) {
  if (isActive == null) return "—";
  return isActive ? "Active" : "Inactive";
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning";
}) {
  const toneStyles = {
    default: {
      card: "border-slate-200 bg-white",
      iconWrap: "bg-slate-100 text-slate-700",
      title: "text-slate-500",
      value: "text-slate-950",
    },
    success: {
      card: "border-emerald-100 bg-emerald-50/70",
      iconWrap: "bg-emerald-100 text-emerald-700",
      title: "text-emerald-700",
      value: "text-emerald-900",
    },
    warning: {
      card: "border-amber-100 bg-amber-50/70",
      iconWrap: "bg-amber-100 text-amber-700",
      title: "text-amber-700",
      value: "text-amber-900",
    },
  }[tone];

  return (
    <div
      className={`rounded-[28px] border p-5 shadow-sm transition hover:shadow-md ${toneStyles.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${toneStyles.title}`}>{title}</p>
          <p className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${toneStyles.value}`}>
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneStyles.iconWrap}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function PropertiesPage() {
  const properties = await getProperties();

  const summary = properties.reduce(
    (acc, property) => {
      acc.totalProperties += 1;
      acc.totalOccupiedUnits += property.occupiedUnits;
      acc.totalVacantUnits += property.vacantUnits;
      acc.totalMonthlyRent += property.monthlyRentTotal;
      return acc;
    },
    {
      totalProperties: 0,
      totalOccupiedUnits: 0,
      totalVacantUnits: 0,
      totalMonthlyRent: 0,
    },
  );

  const totalUnits = summary.totalOccupiedUnits + summary.totalVacantUnits;
  const occupancyRate =
    totalUnits > 0 ? Math.round((summary.totalOccupiedUnits / totalUnits) * 100) : 0;

  const propertyCards = properties.map((property) => ({
    id: property.id,
    name: property.name,
    location: property.location,
    address: property.address,
    occupiedUnits: property.occupiedUnits,
    vacantUnits: property.vacantUnits,
    monthlyRentTotal: property.monthlyRentTotal,
    totalUnits: property.totalUnits,
    type: formatPropertyType((property as { type?: string }).type),
    status: formatPropertyStatus((property as { isActive?: boolean }).isActive),
    unitCount: property.totalUnits,
    activeTenants: property.occupiedUnits,
  }));

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              <Building2 className="h-3.5 w-3.5" />
              Portfolio Overview
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Properties
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
              Manage your organization’s property portfolio with a clearer view of
              occupancy, unit distribution, and monthly rent performance.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/dashboard/org/properties/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              <Plus className="h-4 w-4" />
              Create New Property
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-white/60">
              Total Properties
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {summary.totalProperties}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-white/60">
              Occupied Units
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {summary.totalOccupiedUnits}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-white/60">
              Vacant Units
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {summary.totalVacantUnits}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-white/60">
              Rent Potential
            </p>
            <p className="mt-2 break-words text-2xl font-bold text-white">
              {formatCurrency(summary.totalMonthlyRent)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <StatCard
          title="Portfolio Size"
          value={summary.totalProperties}
          subtitle="Total registered properties"
          icon={Building2}
        />
        <StatCard
          title="Occupied Units"
          value={summary.totalOccupiedUnits}
          subtitle={`${occupancyRate}% current occupancy rate`}
          icon={Users}
          tone="success"
        />
        <StatCard
          title="Vacant Units"
          value={summary.totalVacantUnits}
          subtitle="Units currently available"
          icon={TrendingUp}
          tone="warning"
        />
        <StatCard
          title="Monthly Rent Potential"
          value={formatCurrency(summary.totalMonthlyRent)}
          subtitle="Projected rent from all listed units"
          icon={Wallet}
        />
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Highlights</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              Featured Properties
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A polished overview of your most relevant properties.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Occupancy across all units:{" "}
            <span className="font-semibold text-slate-950">{occupancyRate}%</span>
          </div>
        </div>

        <div className="mt-6">
          <PropertiesCarousel properties={propertyCards} />
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Directory</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              All Properties
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage your full property portfolio in one place.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <PropertiesGrid properties={propertyCards} />
        </div>
      </section>
    </div>
  );
}