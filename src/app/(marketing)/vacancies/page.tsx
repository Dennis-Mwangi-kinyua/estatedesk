import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Home,
  LogIn,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Vacant Houses in Kenya",
  description:
    "Browse available rental houses and vacant units published through EstateDesk by landlords and property managers in Kenya.",
  path: "/vacancies",
});

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    location?: string;
    sort?: string;
  }>;
};

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || "KES";
const FALLBACK_IMAGE = "/images/og-vacancy.svg";

function formatCurrency(value: unknown, currency = DEFAULT_CURRENCY) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function imageUrl(key: string | null | undefined) {
  if (!key) return FALLBACK_IMAGE;
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}

function unitLabel(type: string, bedrooms: number | null) {
  if (type === "APARTMENT" && bedrooms) return `${bedrooms} bedroom apartment`;
  return type.toLowerCase().replaceAll("_", " ");
}

export default async function VacanciesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const location = params?.location?.trim() ?? "";
  const sort = params?.sort === "rent_desc" ? "rent_desc" : params?.sort === "rent_asc" ? "rent_asc" : "location";

  const houses = await prisma.unit.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      status: "VACANT",
      property: {
        isActive: true,
        deletedAt: null,
        ...(location
          ? {
              OR: [
                { location: { contains: location, mode: "insensitive" } },
                { address: { contains: location, mode: "insensitive" } },
                { name: { contains: location, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    },
    orderBy:
      sort === "rent_asc"
        ? [{ rentAmount: "asc" }, { property: { name: "asc" } }]
        : sort === "rent_desc"
          ? [{ rentAmount: "desc" }, { property: { name: "asc" } }]
          : [{ property: { location: "asc" } }, { property: { name: "asc" } }, { houseNo: "asc" }],
    take: 120,
    select: {
      id: true,
      houseNo: true,
      type: true,
      bedrooms: true,
      bathrooms: true,
      roomCount: true,
      rentAmount: true,
      serviceCharge: true,
      viewingFeeRequired: true,
      viewingFeeAmount: true,
      images: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { key: true, fileName: true },
      },
      building: { select: { name: true } },
      property: {
        select: {
          name: true,
          location: true,
          address: true,
          org: { select: { name: true, phone: true } },
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to EstateDesk
          </Link>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <UserPlus className="h-4 w-4" />
              Create account
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4" />
                Verified vacant units
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Vacant houses and apartments
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                View photos, rent details, viewing fee status, and enquire directly with the landlord or property manager.
              </p>
            </div>

            <form className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto] lg:min-w-[32rem]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="location"
                  defaultValue={location}
                  placeholder="Sort or filter by location"
                  className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <select
                  name="sort"
                  defaultValue={sort}
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-500"
                >
                  <option value="location">Location</option>
                  <option value="rent_asc">Rent low to high</option>
                  <option value="rent_desc">Rent high to low</option>
                </select>
                <button className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
          <Home className="h-4 w-4" />
          <span>{houses.length} vacant {houses.length === 1 ? "unit" : "units"} available</span>
        </div>

        {houses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            No vacant units match that search yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {houses.map((listing) => {
              const place = listing.property.location ?? listing.property.address ?? listing.property.name;
              const callHref = listing.property.org.phone ? `tel:${listing.property.org.phone}` : "/contact";

              return (
                <article key={listing.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <Link href={`/vacancies/${listing.id}`} className="block">
                    <div className="relative aspect-[4/3] bg-slate-100">
                      <Image
                        src={imageUrl(listing.images[0]?.key)}
                        alt={listing.images[0]?.fileName ?? listing.property.name}
                        fill
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </Link>

                  <div className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {listing.property.org.name}
                        </p>
                        <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">
                          {listing.property.name} · Unit {listing.houseNo}
                        </h2>
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {listing.viewingFeeRequired ? "Viewing fee" : "Free viewing"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{place}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-2">
                        <BedDouble className="h-4 w-4" />
                        {listing.bedrooms ?? listing.roomCount ?? 0} rooms
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-2">
                        <Bath className="h-4 w-4" />
                        {listing.bathrooms ?? 0} baths
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-2">
                        <Building2 className="h-4 w-4" />
                        {unitLabel(listing.type, listing.bedrooms)}
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">
                          {formatCurrency(listing.rentAmount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Service {listing.serviceCharge ? formatCurrency(listing.serviceCharge) : "included/none"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={callHref}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 transition hover:bg-slate-100"
                          aria-label="Call landlord or agent"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <Link
                          href={`/vacancies/${listing.id}`}
                          className="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          View more
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
