import type { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ContentDepthStack } from "@/components/marketing/content-depth-sections";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import {
  VacancyListingGrid,
  type VacancyListingCard,
} from "@/components/marketing/vacancy-listing-grid";
import { vacancyContentDepth } from "@/lib/content-depth/marketing-depth";
import { publicVacancyImageUrl } from "@/lib/public-vacancy-image";
import {
  getVacancyListingsCached,
  getVacancyListingsCountCached,
  isPublicVacancyDatabaseError,
} from "@/lib/public-vacancy-listings";
import { vacancyListPaginationMetadata } from "@/lib/seo/vacancy-list-pagination-metadata";
import {
  PUBLIC_RENTAL_CATEGORIES,
  PUBLIC_RENTAL_LOCATIONS,
  publicRentalLandingPaths,
} from "@/lib/public-rental-seo";
import { vacancyPublicSlug } from "@/lib/public-vacancy-slug";
import { publicPageMetadata } from "@/lib/seo";
import { APP_URL } from "@/lib/sitemap-utils";
import {
  buildVacancyPageHref,
  paginateItems,
  parsePositiveInt,
  PUBLIC_VACANCY_LIST_PAGE_SIZE,
} from "@/lib/vacancy-pagination";

export const revalidate = 300;

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    location?: string;
    sort?: string;
    page?: string;
  }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const location = params?.location?.trim() ?? "";
  const sort =
    params?.sort === "rent_desc"
      ? "rent_desc"
      : params?.sort === "rent_asc"
        ? "rent_asc"
        : "location";
  const page = parsePositiveInt(params?.page);
  const filterParams = {
    q: query || undefined,
    location: location || undefined,
    sort: sort === "location" ? undefined : sort,
  };
  const path = buildVacancyPageHref("/vacancies", page, filterParams);
  const hasFilters = Boolean(query || location);

  let totalItems = 0;

  try {
    if (hasFilters) {
      const houses = await getVacancyListingsCached({ query, location, sort });
      totalItems = houses.length;
    } else {
      totalItems = await getVacancyListingsCountCached();
    }
  } catch {
    totalItems = 0;
  }

  const baseTitle =
    page > 1
      ? `Vacant houses and apartments in Kenya (Page ${page})`
      : "Vacant houses and apartments in Kenya";
  const title =
    totalItems > 0 && page === 1 && !hasFilters
      ? `${baseTitle} (${totalItems} available)`
      : baseTitle;
  const description =
    totalItems > 0 && !hasFilters
      ? `Browse ${totalItems} vacant homes, rental houses, and available units published through EstateDesk by landlords and property managers in Kenya.`
      : "Browse vacant homes, rental houses, and available units published through EstateDesk by landlords and property managers in Kenya.";

  const base = publicPageMetadata({
    title,
    description,
    path,
  });
  const paginationMeta = vacancyListPaginationMetadata({
    page,
    totalItems,
    title,
    description,
    path,
    filterParams,
  });

  return {
    ...base,
    alternates: paginationMeta.alternates,
    pagination: paginationMeta.pagination,
  };
}

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || "KES";

function formatCurrency(value: unknown, currency = DEFAULT_CURRENCY) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
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

export default async function VacanciesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const location = params?.location?.trim() ?? "";
  const sort = params?.sort === "rent_desc" ? "rent_desc" : params?.sort === "rent_asc" ? "rent_asc" : "location";
  const page = parsePositiveInt(params?.page);
  const filterParams = {
    q: query || undefined,
    location: location || undefined,
    sort: sort === "location" ? undefined : sort,
  };
  const rentalLocationOptions: readonly { slug: string; label: string; county?: string }[] = PUBLIC_RENTAL_LOCATIONS;
  const rentalLocationLabels = new Set(rentalLocationOptions.map((item) => item.label));
  const hasFilters = Boolean(query || location);
  const loginHref = "/login";
  let databaseUnavailable = false;
  let houses: Awaited<ReturnType<typeof getVacancyListingsCached>> = [];

  try {
    houses = await getVacancyListingsCached({ query, location, sort });
  } catch (error) {
    if (!isPublicVacancyDatabaseError(error)) {
      throw error;
    }

    console.warn("Public vacancy listings are temporarily unavailable.");
    databaseUnavailable = true;
  }

  const listingCards: VacancyListingCard[] = houses.map((listing) => {
    const place = listing.property.location ?? listing.property.address ?? listing.property.name;
    const href = `/vacancies/${vacancyPublicSlug({ propertyName: listing.property.name, houseNo: listing.houseNo })}`;
    const rooms = listing.bedrooms ?? listing.roomCount;
    const rentLabel = formatCurrency(listing.rentAmount);
    const shareTitle = `${listing.property.name} Unit ${listing.houseNo} is vacant`;
    const shareText = `${shareTitle} in ${place}. Rent: ${rentLabel}. View details on EstateDesk.`;

    return {
      id: listing.id,
      href,
      imageSrc: listing.images[0]?.key ? publicVacancyImageUrl(listing.images[0].key) : null,
      hasImage: Boolean(listing.images[0]?.key),
      imageAlt: listing.images[0]?.fileName ?? `${listing.property.name} Unit ${listing.houseNo}`,
      managerName: listing.property.org.name,
      propertyName: listing.property.name,
      houseNo: listing.houseNo,
      place,
      typeLabel: unitLabel(listing.type, listing.bedrooms),
      roomsLabel: rooms ? `${rooms} room${rooms === 1 ? "" : "s"}` : "Rooms",
      bathsLabel: listing.bathrooms
        ? `${listing.bathrooms} bath${listing.bathrooms === 1 ? "" : "s"}`
        : "Not listed",
      rentLabel,
      serviceChargeLabel: listing.serviceCharge
        ? `Service charge ${formatCurrency(listing.serviceCharge)}`
        : "No service charge",
      viewingLabel: listing.viewingFeeRequired
        ? listing.viewingFeeAmount
          ? `Viewing ${formatCurrency(listing.viewingFeeAmount)}`
          : "Viewing fee"
        : "Free viewing",
      description: listingDescription({
        notes: listing.notes,
        propertyNotes: listing.property.notes,
        type: listing.type,
        bedrooms: listing.bedrooms,
        place,
      }),
      callHref: listing.property.org.phone ? `tel:${listing.property.org.phone}` : "/contact",
      shareUrl: `${APP_URL}${href}`,
      shareTitle,
      shareText,
    };
  });
  const { items: visibleListingCards, pagination } = paginateItems(
    listingCards,
    page,
    PUBLIC_VACANCY_LIST_PAGE_SIZE,
  );
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "EstateDesk vacant houses and apartments",
    itemListElement: visibleListingCards.map((listing, index) => ({
      "@type": "ListItem",
      position: pagination.start + index + 1,
      url: listing.shareUrl,
      name: `${listing.propertyName} Unit ${listing.houseNo}`,
    })),
  };
  const popularLandingLinks = publicRentalLandingPaths()
    .filter(({ location, category }) => {
      const priorityLocations = ["nairobi", "ruaka", "kiambu", "thika", "rongai", "kitengela", "nakuru"];
      const priorityCategories = ["bedsitters", "single-rooms", "studios", "apartments", "shops"];
      return priorityLocations.includes(location) && priorityCategories.includes(category);
    })
    .slice(0, 30);
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      itemListJsonLd,
      {
        "@type": "CollectionPage",
        name: "Vacant houses, apartments, bedsitters, shops, and offices",
        url: `${APP_URL}/vacancies`,
        description:
          "Browse available rental units published through EstateDesk by landlords and property managers.",
        about: PUBLIC_RENTAL_CATEGORIES.map((category) => category.pluralLabel),
        areaServed: PUBLIC_RENTAL_LOCATIONS.map((location) => ({
          "@type": "Place",
          name: location.label,
        })),
      },
    ],
  };

  return (
    <main className="ed-theme-page min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <PublicAccessHeader active="vacancies" loginHref={loginHref} />

      <section className="border-b border-slate-200 bg-white/85 dark:border-white/10 dark:bg-slate-900/80">
        <div className="mx-auto max-w-screen-2xl px-4 py-7 sm:px-6 lg:px-8 2xl:max-w-none">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm dark:border-cyan-200/50 dark:bg-cyan-200/15 dark:text-cyan-50">
                <ShieldCheck className="h-4 w-4" />
                Verified vacant units
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Vacant houses and apartments
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-[#d1d5db]">
                Find verified available units with clear pricing, location details, and direct access to the managing office.
              </p>
            </div>

            <form
              action="/vacancies"
              method="get"
              className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/12 dark:bg-[#0f1319] sm:grid-cols-[1fr_0.75fr_auto] lg:min-w-[42rem]"
            >
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search by house, property, manager..."
                  className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/12 dark:bg-[#171b22] dark:text-[#f8fafc] dark:placeholder:text-[#9ca3af] dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                />
              </label>
              <label className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  name="location"
                  defaultValue={location}
                  aria-label="Filter vacancies by town"
                  className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/12 dark:bg-[#171b22] dark:text-[#f8fafc] dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                >
                  <option value="">All towns</option>
                  {location && !rentalLocationLabels.has(location) ? (
                    <option value={location}>{location}</option>
                  ) : null}
                  {rentalLocationOptions.map((item) => (
                    <option key={item.slug} value={item.label}>
                      {item.county ? `${item.label}, ${item.county}` : item.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <select
                  name="sort"
                  defaultValue={sort}
                  aria-label="Sort vacancies"
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/12 dark:bg-[#171b22] dark:text-[#f8fafc] dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                >
                  <option value="location">Location</option>
                  <option value="rent_asc">Rent low to high</option>
                  <option value="rent_desc">Rent high to low</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:bg-white dark:text-[#0b0f16] dark:hover:bg-[#e5e7eb] dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#0b0f16] [&_*]:text-current"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 2xl:max-w-none">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-[#d1d5db]">
            <Home className="h-4 w-4" />
            <span>
              {pagination.pageCount > 1
                ? `Showing ${pagination.start + 1}-${pagination.end} of ${pagination.total} vacant units`
                : `${pagination.total} vacant ${pagination.total === 1 ? "unit" : "units"} available`}
            </span>
          </div>
          {hasFilters ? (
            <Link href="/vacancies" className="text-sm font-semibold text-slate-700 transition hover:text-slate-950 dark:text-[#d1d5db] dark:hover:text-white">
              Clear search
            </Link>
          ) : null}
        </div>

        {databaseUnavailable ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm dark:border-white/12 dark:bg-[#111827] dark:text-[#d1d5db]">
            Vacancies are temporarily unavailable. Please refresh in a moment.
          </div>
        ) : houses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-white/15 dark:bg-[#111827] dark:text-[#d1d5db]">
            No vacant units match that search yet.
          </div>
        ) : (
          <VacancyListingGrid
            listings={visibleListingCards}
            pagination={pagination}
            searchParams={filterParams}
          />
        )}

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/12 dark:bg-[#111827]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                Popular rental searches
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#d1d5db]">
                Browse high-intent local searches for vacant homes, rooms, shops, and apartments.
              </p>
            </div>
            <Link href="/property-management-software-kenya" className="text-sm font-semibold text-slate-700 hover:text-slate-950 dark:text-[#d1d5db] dark:hover:text-white">
              Property management software Kenya
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {popularLandingLinks.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white dark:border-white/12 dark:bg-white/[0.06] dark:text-[#f8fafc] dark:hover:border-white/24 dark:hover:bg-white/[0.10]"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      </section>

      <ContentDepthStack {...vacancyContentDepth} />
      <PublicAccessFooter />
    </main>
  );
}
