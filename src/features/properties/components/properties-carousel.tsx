"use client";

import Link from "next/link";
import { memo, useCallback, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, Users, Building2 } from "lucide-react";

type PropertyCardItem = {
  id: string;
  name: string;
  location?: string | null;
  address?: string | null;
  occupiedUnits: number;
  vacantUnits: number;
  monthlyRentTotal: number;
  totalUnits: number;
  type: string;
  status: string;
  unitCount: number;
  activeTenants: number;
};

type PropertiesCarouselProps = {
  properties: PropertyCardItem[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

const PropertyCarouselCard = memo(function PropertyCarouselCard({
  property,
}: {
  property: PropertyCardItem;
}) {
  const occupancyRate =
    property.totalUnits > 0
      ? Math.round((property.occupiedUnits / property.totalUnits) * 100)
      : 0;

  return (
    <article className="min-w-[280px] snap-start rounded-[28px] border bg-white p-5 shadow-sm transition hover:shadow-md sm:min-w-[320px] lg:min-w-[360px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {property.type}
          </p>

          <h3 className="mt-3 truncate text-lg font-semibold tracking-tight text-gray-950">
            {property.name}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {property.location || property.address || "No location provided"}
            </span>
          </div>
        </div>

        <span
          className={[
            "rounded-full px-2.5 py-1 text-xs font-medium",
            property.status === "Active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          {property.status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Building2 className="h-4 w-4" />
            Units
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-950">
            {property.totalUnits}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-3">
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <Users className="h-4 w-4" />
            Occupied
          </div>
          <p className="mt-1 text-lg font-semibold text-emerald-800">
            {property.occupiedUnits}
          </p>
        </div>

        <div className="rounded-2xl bg-amber-50 p-3">
          <p className="text-xs text-amber-700">Vacant</p>
          <p className="mt-1 text-lg font-semibold text-amber-800">
            {property.vacantUnits}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-gray-500">Monthly Rent</p>
          <p className="mt-1 truncate text-lg font-semibold text-gray-950">
            {formatCurrency(property.monthlyRentTotal)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Occupancy</span>
          <span>{occupancyRate}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-neutral-950 transition-all"
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {property.activeTenants} active tenants
        </p>

        <Link
          href={`/dashboard/org/properties/${property.id}`}
          className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          View Property
        </Link>
      </div>
    </article>
  );
});

export const PropertiesCarousel = memo(function PropertiesCarousel({
  properties,
}: PropertiesCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const hasProperties = properties.length > 0;

  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => b.totalUnits - a.totalUnits);
  }, [properties]);

  const scrollByAmount = useCallback((direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    const amount = Math.round(container.clientWidth * 0.85);
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  if (!hasProperties) {
    return (
      <div className="rounded-[28px] border bg-white p-8 text-center shadow-sm">
        <h3 className="text-base font-semibold text-gray-950">
          No properties yet
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Add your first property to start tracking occupancy and rent potential.
        </p>
        <Link
          href="/dashboard/org/properties/new"
          className="mt-4 inline-flex rounded-2xl bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Create New Property
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-white text-gray-700 shadow-sm transition hover:bg-slate-50"
          aria-label="Scroll properties left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-white text-gray-700 shadow-sm transition hover:bg-slate-50"
          aria-label="Scroll properties right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {sortedProperties.map((property) => (
          <PropertyCarouselCard
            key={property.id}
            property={property}
          />
        ))}
      </div>
    </div>
  );
});