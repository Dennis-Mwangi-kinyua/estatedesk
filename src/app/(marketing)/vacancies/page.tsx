import Link from "next/link";
import {
  Home,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Prisma } from "@prisma/client";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import {
  VacancyListingGrid,
  type VacancyListingCard,
} from "@/components/marketing/vacancy-listing-grid";
import { isTransientDatabaseError, retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Public Information Kiosk - EstateDesk",
  description:
    "Browse vacant homes, rental houses, and available units published through EstateDesk by landlords and property managers in Kenya.",
  path: "/vacancies",
});

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
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

function listingDescription({
  notes,
  propertyNotes,
  type,
  bedrooms,
  place,
}: {
  notes: string | null;
  propertyNotes: string | null;
  type: string;
  bedrooms: number | null;
  place: string;
}) {
  const customDescription = notes?.trim() || propertyNotes?.trim();
  if (customDescription) return customDescription;

  return `${unitLabel(type, bedrooms)} in ${place} with rent, viewing, and manager details ready for review.`;
}

function buildLoginHref(returnTo: string) {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

function isPublicVacancyDatabaseError(error: unknown) {
  if (isTransientDatabaseError(error)) return true;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021" || error.code === "P2022";
  }

  return false;
}

function getVacancyListings({
  query,
  location,
  sort,
}: {
  query: string;
  location: string;
  sort: "location" | "rent_asc" | "rent_desc";
}) {
  return retryTransientDatabaseOperation(
    () =>
      prisma.unit.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          status: "VACANT",
          ...(query
            ? {
                OR: [
                  { houseNo: { contains: query, mode: "insensitive" } },
                  { property: { is: { name: { contains: query, mode: "insensitive" } } } },
                  { property: { is: { location: { contains: query, mode: "insensitive" } } } },
                  { property: { is: { address: { contains: query, mode: "insensitive" } } } },
                  { property: { is: { org: { is: { name: { contains: query, mode: "insensitive" } } } } } },
                  { building: { is: { name: { contains: query, mode: "insensitive" } } } },
                ],
              }
            : {}),
          property: {
            is: {
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
          notes: true,
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
              notes: true,
              org: { select: { name: true, phone: true } },
            },
          },
        },
      }),
    { label: "public-vacancy-list" },
  );
}

export default async function VacanciesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const location = params?.location?.trim() ?? "";
  const sort = params?.sort === "rent_desc" ? "rent_desc" : params?.sort === "rent_asc" ? "rent_asc" : "location";
  const hasFilters = Boolean(query || location);
  const returnParams = new URLSearchParams();
  if (query) returnParams.set("q", query);
  if (location) returnParams.set("location", location);
  if (sort !== "location") returnParams.set("sort", sort);
  const returnTo = `/vacancies${returnParams.size ? `?${returnParams.toString()}` : ""}`;
  const loginHref = buildLoginHref(returnTo);
  let databaseUnavailable = false;
  let houses: Awaited<ReturnType<typeof getVacancyListings>> = [];

  try {
    houses = await getVacancyListings({ query, location, sort });
  } catch (error) {
    if (!isPublicVacancyDatabaseError(error)) {
      throw error;
    }

    console.warn("Public vacancy listings are temporarily unavailable.");
    databaseUnavailable = true;
  }

  const listingCards: VacancyListingCard[] = houses.map((listing) => {
    const place = listing.property.location ?? listing.property.address ?? listing.property.name;
    const href = `/vacancies/${listing.id}`;
    const rooms = listing.bedrooms ?? listing.roomCount;

    return {
      id: listing.id,
      href,
      imageSrc: imageUrl(listing.images[0]?.key),
      hasImage: Boolean(listing.images[0]?.key),
      imageAlt: listing.images[0]?.fileName ?? `${listing.property.name} Unit ${listing.houseNo}`,
      managerName: listing.property.org.name,
      propertyName: listing.property.name,
      houseNo: listing.houseNo,
      place,
      typeLabel: unitLabel(listing.type, listing.bedrooms),
      roomsLabel: rooms ? `${rooms} room${rooms === 1 ? "" : "s"}` : "Rooms",
      bathsLabel: listing.bathrooms ? `${listing.bathrooms} bath${listing.bathrooms === 1 ? "" : "s"}` : "Baths",
      rentLabel: formatCurrency(listing.rentAmount),
      serviceChargeLabel: listing.serviceCharge
        ? `Service ${formatCurrency(listing.serviceCharge)}`
        : "Service included/none",
      viewingLabel: listing.viewingFeeRequired ? "Viewing fee" : "Free viewing",
      description: listingDescription({
        notes: listing.notes,
        propertyNotes: listing.property.notes,
        type: listing.type,
        bedrooms: listing.bedrooms,
        place,
      }),
      callHref: listing.property.org.phone ? `tel:${listing.property.org.phone}` : "/contact",
    };
  });

  return (
    <main className="min-h-screen bg-[#F2F6FB] text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <PublicAccessHeader active="vacancies" loginHref={loginHref} />

      <section className="border-b border-white/80 bg-white/60 dark:border-white/10 dark:bg-slate-900/60">
        <div className="mx-auto max-w-screen-2xl px-4 py-7 sm:px-6 lg:px-8 2xl:max-w-none">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100">
                <ShieldCheck className="h-4 w-4" />
                Verified vacant units
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Vacant houses and apartments
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Browse a paginated grid of vacant homes with photos, rent details, descriptions, and direct manager contacts.
              </p>
            </div>

            <form className="grid gap-2 rounded-xl border border-white/85 bg-white/80 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:grid-cols-[1fr_0.75fr_auto] lg:min-w-[42rem]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search by house, property, manager..."
                  className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                />
              </label>
              <label className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="location"
                  defaultValue={location}
                  placeholder="Location"
                  className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                />
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <select
                  name="sort"
                  defaultValue={sort}
                  aria-label="Sort vacancies"
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                >
                  <option value="location">Location</option>
                  <option value="rent_asc">Rent low to high</option>
                  <option value="rent_desc">Rent high to low</option>
                </select>
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                  <SlidersHorizontal className="h-4 w-4" />
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 2xl:max-w-none">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Home className="h-4 w-4" />
            <span>{houses.length} vacant {houses.length === 1 ? "unit" : "units"} available</span>
          </div>
          {hasFilters ? (
            <Link href="/vacancies" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
              Clear search
            </Link>
          ) : null}
        </div>

        {databaseUnavailable ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
            Vacancies are temporarily unavailable. Please refresh in a moment.
          </div>
        ) : houses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-white/15 dark:bg-slate-900 dark:text-slate-300">
            No vacant units match that search yet.
          </div>
        ) : (
          <VacancyListingGrid listings={listingCards} />
        )}
      </section>
    </main>
  );
}
