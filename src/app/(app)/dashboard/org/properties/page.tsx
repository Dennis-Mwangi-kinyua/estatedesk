import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Home,
  MapPin,
  Plus,
  Search,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { getProperties } from "@/features/properties/queries/get-properties";

type PropertyRecord = Awaited<ReturnType<typeof getProperties>>[number];

type SearchParams = {
  q?: string | string[];
  page?: string | string[];
};

type PropertyCardItem = {
  id: string;
  name: string;
  location: string;
  address: string;
  occupiedUnits: number;
  vacantUnits: number;
  monthlyRentTotal: number;
  totalUnits: number;
  type: string;
  status: string;
  unitCount: number;
  activeTenants: number;
};

type PortfolioSummary = {
  totalProperties: number;
  totalOccupiedUnits: number;
  totalVacantUnits: number;
  totalMonthlyRent: number;
  totalUnits: number;
  occupancyRate: number;
};

const ITEMS_PER_PAGE = 12;
const sectionCardClass =
  "rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6";

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

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildPortfolioSummary(properties: PropertyRecord[]): PortfolioSummary {
  const base = properties.reduce(
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

  const totalUnits = base.totalOccupiedUnits + base.totalVacantUnits;
  const occupancyRate =
    totalUnits > 0 ? Math.round((base.totalOccupiedUnits / totalUnits) * 100) : 0;

  return {
    ...base,
    totalUnits,
    occupancyRate,
  };
}

function mapPropertiesToCards(properties: PropertyRecord[]): PropertyCardItem[] {
  return properties.map((property) => {
    const meta = property as PropertyRecord & {
      type?: string | null;
      isActive?: boolean | null;
    };

    return {
      id: property.id,
      name: property.name,
      location: property.location ?? "—",
      address: property.address ?? "—",
      occupiedUnits: property.occupiedUnits,
      vacantUnits: property.vacantUnits,
      monthlyRentTotal: property.monthlyRentTotal,
      totalUnits: property.totalUnits,
      type: formatPropertyType(meta.type),
      status: formatPropertyStatus(meta.isActive),
      unitCount: property.totalUnits,
      activeTenants: property.occupiedUnits,
    };
  });
}

function filterProperties(properties: PropertyCardItem[], query: string) {
  if (!query.trim()) return properties;

  const normalizedQuery = query.trim().toLowerCase();

  return properties.filter((property) => {
    return [
      property.name,
      property.location,
      property.address,
      property.type,
      property.status,
      String(property.totalUnits),
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

function buildPageHref(page: number, query: string) {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set("q", query.trim());
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();
  return queryString
    ? `/dashboard/org/properties?${queryString}`
    : "/dashboard/org/properties";
}

function getPaginationPages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (currentPage >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
  ];
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
  icon: ComponentType<{ className?: string }>;
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
      className={`rounded-[22px] border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${toneStyles.card}`}
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

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}

function SearchBar({ query }: { query: string }) {
  return (
    <form method="GET" className="mt-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by property name, location, address, or type"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Search
          </button>

          {query ? (
            <Link
              href="/dashboard/org/properties"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function PropertyOverviewCard({ property }: { property: PropertyCardItem }) {
  const occupancyRate =
    property.totalUnits > 0
      ? Math.round((property.occupiedUnits / property.totalUnits) * 100)
      : 0;

  return (
    <Link
      href={`/dashboard/org/properties/${property.id}`}
      className="group block h-full rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              {property.type}
            </div>

            <h3 className="mt-3 truncate text-lg font-semibold tracking-tight text-slate-950 transition group-hover:text-slate-700">
              {property.name}
            </h3>

            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>

            <p className="mt-1 truncate text-sm text-slate-500">{property.address}</p>
          </div>

          <div
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              property.status === "Active"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {property.status}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 rounded-[18px] bg-slate-50 p-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Units
            </p>
            <p className="mt-1 text-base font-semibold text-slate-950">{property.totalUnits}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Occupied
            </p>
            <p className="mt-1 text-base font-semibold text-slate-950">
              {property.occupiedUnits}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Vacant
            </p>
            <p className="mt-1 text-base font-semibold text-slate-950">{property.vacantUnits}</p>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Monthly Rent
            </p>
            <p className="mt-1 text-base font-semibold text-slate-950">
              {formatCurrency(property.monthlyRentTotal)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Occupancy
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-slate-950">
              {occupancyRate}%
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <section className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Home className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          {hasQuery ? "No matching properties found" : "No properties yet"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {hasQuery
            ? "Try another search term or clear the current filter to see the rest of your portfolio."
            : "Start building your portfolio by creating your first property. Once added, your property cards and insights will appear here."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {hasQuery ? (
            <Link
              href="/dashboard/org/properties"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear Search
            </Link>
          ) : null}

          <Link
            href="/dashboard/org/properties/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Create New Property
          </Link>
        </div>
      </div>
    </section>
  );
}

function Pagination({
  currentPage,
  totalPages,
  query,
}: {
  currentPage: number;
  totalPages: number;
  query: string;
}) {
  if (totalPages <= 1) return null;

  const pages = getPaginationPages(currentPage, totalPages);

  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-950">{currentPage}</span> of{" "}
        <span className="font-semibold text-slate-950">{totalPages}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildPageHref(Math.max(1, currentPage - 1), query)}
          aria-disabled={currentPage === 1}
          className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
            currentPage === 1
              ? "pointer-events-none border-slate-100 text-slate-300"
              : "border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Link>

        {pages.map((page) => {
          const isActive = page === currentPage;

          return (
            <Link
              key={page}
              href={buildPageHref(page, query)}
              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {page}
            </Link>
          );
        })}

        <Link
          href={buildPageHref(Math.min(totalPages, currentPage + 1), query)}
          aria-disabled={currentPage === totalPages}
          className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
            currentPage === totalPages
              ? "pointer-events-none border-slate-100 text-slate-300"
              : "border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const query = getSingleValue(resolvedSearchParams.q).trim();
  const requestedPage = Number.parseInt(getSingleValue(resolvedSearchParams.page) || "1", 10);

  const properties = await getProperties();
  const summary = buildPortfolioSummary(properties);
  const propertyCards = mapPropertiesToCards(properties);
  const filteredProperties = filterProperties(propertyCards, query);
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / ITEMS_PER_PAGE));
  const currentPage = Number.isNaN(requestedPage)
    ? 1
    : Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProperties = filteredProperties.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );
  const showingFrom = filteredProperties.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + ITEMS_PER_PAGE, filteredProperties.length);
  const hasProperties = properties.length > 0;
  const hasFilteredResults = filteredProperties.length > 0;

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <Building2 className="h-3.5 w-3.5" />
              Portfolio Overview
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Properties
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Search, browse, and manage your property portfolio through a clean,
              professional card layout with faster access to each property.
            </p>
          </div>

          <Link
            href="/dashboard/org/properties/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Create New Property
          </Link>
        </div>

        <SearchBar query={query} />
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
          subtitle={`${summary.occupancyRate}% current occupancy rate`}
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

      {!hasProperties || !hasFilteredResults ? (
        <EmptyState hasQuery={Boolean(query && hasProperties)} />
      ) : (
        <section className={sectionCardClass}>
          <SectionHeader
            eyebrow="Directory"
            title="All Properties"
            description="Professionally arranged, clickable cards with search and pagination for easier browsing."
            action={
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-950">{showingFrom}</span>
                {" "}to <span className="font-semibold text-slate-950">{showingTo}</span>
                {" "}of <span className="font-semibold text-slate-950">{filteredProperties.length}</span>
                {query ? " filtered properties" : " properties"}
              </div>
            }
          />

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {paginatedProperties.map((property) => (
              <PropertyOverviewCard key={property.id} property={property} />
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} query={query} />
        </section>
      )}
    </div>
  );
}
