import { vacancyCosts } from "@/lib/vacancy-costs";
import { vacancyRecordDate } from "@/lib/vacancy-record-date";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { House as Home, Search, Building2 } from "@/components/shared/colored-icons";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { serializeJsonForHtml } from "@/lib/security/safe-json";
import {
  VacancyListingGrid,
  type VacancyListingCard,
} from "@/components/marketing/vacancy-listing-grid";
import { publicVacancyImageUrl } from "@/lib/public-vacancy-image";
import {
  getVacancyListingsCountCached,
  getVacancyListingsPageCached,
  isPublicVacancyDatabaseError,
  PUBLIC_VACANCY_LIST_PAGE_SIZE,
  type VacancyListSort,
} from "@/lib/public-vacancy-listings";
import { vacancyListPaginationMetadata } from "@/lib/seo/vacancy-list-pagination-metadata";
import {
  PUBLIC_RENTAL_CATEGORIES,
  PUBLIC_RENTAL_LOCATIONS,
  publicRentalLandingPaths,
} from "@/lib/public-rental-seo";
import { resolvePublicListingHref } from "@/lib/public-vacancy-slug";
import { publicPageMetadata } from "@/lib/seo";
import { APP_URL } from "@/lib/sitemap-utils";
import {
  buildVacancyPagination,
  buildVacancyPageHref,
  parseOptionalNonNegativeNumber,
  parseOptionalPositiveInt,
  parsePositiveInt,
} from "@/lib/vacancy-pagination";
import { telHref } from "@/lib/vacancy-contact";

export const revalidate = 300;

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    location?: string;
    sort?: string;
    page?: string;
    type?: string;
    minRent?: string;
    maxRent?: string;
    bedrooms?: string;
  }>;
};

const UNIT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "BEDSITTER", label: "Bedsitter" },
  { value: "STUDIO", label: "Studio" },
  { value: "SINGLE_ROOM", label: "Single room" },
  { value: "SHOP", label: "Shop" },
  { value: "OFFICE", label: "Office" },
  { value: "STALL", label: "Stall" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "GODOWN", label: "Godown" },
] as const;

function parseSort(value: string | undefined): VacancyListSort {
  if (value === "rent_desc" || value === "rent_asc" || value === "newest") {
    return value;
  }
  return "location";
}

function parseFilters(
  params?: Awaited<NonNullable<PageProps["searchParams"]>> | null,
) {
  const query = params?.q?.trim() ?? "";
  const location = params?.location?.trim() ?? "";
  const sort = parseSort(params?.sort);
  const type = params?.type?.trim().toUpperCase() || undefined;
  const minRent = parseOptionalNonNegativeNumber(params?.minRent);
  const maxRent = parseOptionalNonNegativeNumber(params?.maxRent);
  const bedrooms = parseOptionalPositiveInt(params?.bedrooms);
  const page = parsePositiveInt(params?.page);

  return {
    query,
    location,
    sort,
    type,
    minRent,
    maxRent,
    bedrooms,
    page,
    filterParams: {
      q: query || undefined,
      location: location || undefined,
      sort: sort === "location" ? undefined : sort,
      type: type || undefined,
      minRent: minRent != null ? String(minRent) : undefined,
      maxRent: maxRent != null ? String(maxRent) : undefined,
      bedrooms: bedrooms != null ? String(bedrooms) : undefined,
    },
    hasFilters: Boolean(
      query || location || type || minRent != null || maxRent != null || bedrooms != null || sort !== "location",
    ),
  };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const filters = parseFilters(params);
  const path = buildVacancyPageHref("/vacancies", filters.page, filters.filterParams);

  let totalItems = 0;

  try {
    totalItems = await getVacancyListingsCountCached({
      query: filters.query,
      location: filters.location,
      type: filters.type,
      minRent: filters.minRent,
      maxRent: filters.maxRent,
      bedrooms: filters.bedrooms,
    });
  } catch {
    totalItems = 0;
  }

  const baseTitle =
    filters.page > 1
      ? `Vacant houses and apartments in Kenya (Page ${filters.page})`
      : "Vacant houses and apartments in Kenya";
  const title =
    totalItems > 0 && filters.page === 1 && !filters.hasFilters
      ? `${baseTitle} (${totalItems} available)`
      : baseTitle;
  const description =
    totalItems > 0 && !filters.hasFilters
      ? `Browse ${totalItems} vacant homes, rental houses, and available units published through EstateDesk by landlords and property managers in Kenya.`
      : "Browse vacant homes, rental houses, and available units published through EstateDesk by landlords and property managers in Kenya.";

  const base = publicPageMetadata({
    title,
    description,
    path,
  });
  const paginationMeta = vacancyListPaginationMetadata({
    page: filters.page,
    totalItems,
    title,
    description,
    path,
    filterParams: filters.filterParams,
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
  const filters = parseFilters(params);
  const rentalLocationOptions: readonly { slug: string; label: string; county?: string }[] =
    PUBLIC_RENTAL_LOCATIONS;
  const rentalLocationLabels = new Set(rentalLocationOptions.map((item) => item.label));
  const loginHref = "/login";
  let databaseUnavailable = false;
  let listPage: Awaited<ReturnType<typeof getVacancyListingsPageCached>> = {
    items: [],
    total: 0,
    page: filters.page,
    pageSize: PUBLIC_VACANCY_LIST_PAGE_SIZE,
  };

  try {
    listPage = await getVacancyListingsPageCached({
      query: filters.query,
      location: filters.location,
      sort: filters.sort,
      type: filters.type,
      minRent: filters.minRent,
      maxRent: filters.maxRent,
      bedrooms: filters.bedrooms,
      page: filters.page,
      pageSize: PUBLIC_VACANCY_LIST_PAGE_SIZE,
    });
  } catch (error) {
    if (!isPublicVacancyDatabaseError(error)) {
      throw error;
    }

    console.warn("Public vacancy listings are temporarily unavailable.");
    databaseUnavailable = true;
  }

  const pagination = buildVacancyPagination(
    listPage.total,
    listPage.page,
    listPage.pageSize,
  );

  const listingCards: VacancyListingCard[] = listPage.items.map((listing) => {
    const place =
      listing.property.location ?? listing.property.address ?? listing.property.name;
    const href = resolvePublicListingHref({
      publicSlug: listing.publicSlug,
      propertyName: listing.property.name,
      houseNo: listing.houseNo,
    });
    const rooms = listing.bedrooms ?? listing.roomCount;
    const rentLabel = formatCurrency(listing.rentAmount);
    const shareTitle = `${listing.property.name} Unit ${listing.houseNo} is vacant`;
    const shareText = `${shareTitle} in ${place}. Rent: ${rentLabel}. View details on EstateDesk.`;
    const recordDate = vacancyRecordDate(listing.updatedAt);

    return {
      id: listing.id,
      href,
      imageSrc: listing.images[0]?.key
        ? publicVacancyImageUrl(listing.images[0].key)
        : null,
      hasImage: Boolean(listing.images[0]?.key),
      imageAlt:
        listing.images[0]?.fileName ??
        `${listing.property.name} Unit ${listing.houseNo}`,
      managerName: listing.property.org.name,
      propertyName: listing.property.name,
      houseNo: listing.houseNo,
      place,
      typeLabel: unitLabel(listing.type, listing.bedrooms),
      roomsLabel: rooms ? `${rooms} room${rooms === 1 ? "" : "s"}` : "Rooms not listed",
      bathsLabel: listing.bathrooms
        ? `${listing.bathrooms} bath${listing.bathrooms === 1 ? "" : "s"}`
        : "Baths not listed",
      rentLabel,
      initialCostLabel: `${vacancyCosts(listing).complete ? "Estimated initial cost" : "Known costs from"} ${formatCurrency(vacancyCosts(listing).knownTotal)}`,
      updatedLabel: recordDate ? `Record updated ${recordDate}` : "Record update date unavailable",
      serviceChargeLabel: listing.serviceCharge != null
        ? `Service charge ${formatCurrency(listing.serviceCharge)}`
        : "Service charge: confirm with manager",
      depositLabel: listing.depositAmount != null
        ? `Deposit ${formatCurrency(listing.depositAmount)}`
        : "Deposit: confirm with manager",
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
      callHref: telHref(listing.property.org.phone, "/contact"),
      shareUrl: `${APP_URL}${href}`,
      shareTitle,
      shareText,
    };
  });

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "EstateDesk vacant houses and apartments",
    numberOfItems: pagination.total,
    itemListElement: listingCards.map((listing, index) => ({
      "@type": "ListItem",
      position: pagination.start + index + 1,
      url: listing.shareUrl,
      name: `${listing.propertyName} Unit ${listing.houseNo}`,
    })),
  };
  const popularLandingLinks = publicRentalLandingPaths()
    .filter(({ location, category }) => {
      const priorityLocations = [
        "nairobi",
        "ruaka",
        "kiambu",
        "thika",
        "rongai",
        "kitengela",
        "nakuru",
      ];
      const priorityCategories = [
        "bedsitters",
        "single-rooms",
        "studios",
        "apartments",
        "shops",
      ];
      return (
        priorityLocations.includes(location) && priorityCategories.includes(category)
      );
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
    <main className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(collectionJsonLd) }}
      />
      <PublicAccessHeader active="vacancies" loginHref={loginHref} />

      <section className="border-b border-slate-200 bg-white/85 dark:border-white/10 dark:bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="space-y-7">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm dark:border-cyan-200/50 dark:bg-cyan-200/15 dark:text-cyan-50">
                <Building2 className="h-4 w-4" />
                Find your next place
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Find your next home or business space
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-[#d1d5db]">
                Find available units with clear pricing, location details, and direct access to the managing office.
              </p>
            </div>

            <form
              action="/vacancies"
              method="get"
              className="vacancy-search grid w-full gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label="Search available properties"
            >
              <div className="grid gap-2 sm:grid-cols-[1fr_0.85fr]">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    defaultValue={filters.query}
                    aria-label="Search properties or managers"
                    placeholder="Property, unit or manager"
                    className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/12 dark:bg-[#171b22] dark:text-[#f8fafc] dark:placeholder:text-[#9ca3af] dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                  />
                </label>
                <label className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    name="location"
                    defaultValue={filters.location}
                    aria-label="Filter vacancies by town"
                    className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/12 dark:bg-[#171b22] dark:text-[#f8fafc] dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                  >
                    <option value="">All towns</option>
                    {filters.location && !rentalLocationLabels.has(filters.location) ? (
                      <option value={filters.location}>{filters.location}</option>
                    ) : null}
                    {rentalLocationOptions.map((item) => (
                      <option key={item.slug} value={item.label}>
                        {item.county ? `${item.label}, ${item.county}` : item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <details open={Boolean(filters.type || filters.minRent != null || filters.maxRent != null || filters.bedrooms != null || filters.sort !== "location")} className="rounded-lg border border-slate-200 px-3 dark:border-white/12">
                <summary className="flex min-h-11 cursor-pointer flex-col items-start justify-center gap-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  More filters
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-300">Type, rent, rooms and sort</span>
                </summary>
                <div className="grid gap-2 pb-3 sm:grid-cols-2 lg:grid-cols-4">
                <select
                  name="type"
                  defaultValue={filters.type ?? ""}
                  aria-label="Filter by unit type"
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/12 dark:bg-[#171b22] dark:text-[#f8fafc] dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                >
                  {UNIT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  name="minRent"
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={filters.minRent ?? ""}
                  placeholder="Min rent (KES)"
                  aria-label="Minimum rent"
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/12 dark:bg-[#171b22] dark:text-[#f8fafc] dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                />
                <input
                  name="maxRent"
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={filters.maxRent ?? ""}
                  placeholder="Max rent (KES)"
                  aria-label="Maximum rent"
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/12 dark:bg-[#171b22] dark:text-[#f8fafc] dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                />
                <select
                  name="bedrooms"
                  defaultValue={filters.bedrooms != null ? String(filters.bedrooms) : ""}
                  aria-label="Minimum bedrooms or rooms"
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/12 dark:bg-[#171b22] dark:text-[#f8fafc] dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                >
                  <option value="">Any rooms</option>
                  <option value="1">1+ rooms</option>
                  <option value="2">2+ rooms</option>
                  <option value="3">3+ rooms</option>
                  <option value="4">4+ rooms</option>
                </select>
                </div>
                <div className="pb-3">
                <select
                  name="sort"
                  defaultValue={filters.sort}
                  aria-label="Sort vacancies"
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/12 dark:bg-[#171b22] dark:text-[#f8fafc] dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                >
                  <option value="location">Location</option>
                  <option value="newest">Newest updates</option>
                  <option value="rent_asc">Rent low to high</option>
                  <option value="rent_desc">Rent high to low</option>
                </select>
                </div>
              </details>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Browse listings. Contact the managing office directly.</p>
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:bg-white dark:text-[#0b0f16] dark:hover:bg-[#e5e7eb] dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#0b0f16] [&_*]:text-current sm:w-auto sm:justify-self-end"
                >
                  <Search className="h-4 w-4" />
                  Search vacancies
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-[#d1d5db]" aria-live="polite">
            <Home className="h-4 w-4" />
            <span>
              {pagination.total === 0
                ? "No vacant units match these filters"
                : pagination.pageCount > 1
                  ? `Showing ${pagination.start + 1}-${pagination.end} of ${pagination.total} vacant units`
                  : `${pagination.total} vacant ${pagination.total === 1 ? "unit" : "units"} available`}
            </span>
          </div>
          {filters.hasFilters ? (
            <Link
              href="/vacancies"
              className="text-sm font-semibold text-slate-700 transition hover:text-slate-950 dark:text-[#d1d5db] dark:hover:text-white"
            >
              Clear filters
            </Link>
          ) : null}
        </div>

        {filters.hasFilters ? <div aria-label="Active search filters" className="mb-6 flex flex-wrap gap-2">{Object.entries(filters.filterParams).filter(([, value]) => value !== undefined).map(([key, value]) => {
          const labels: Record<string, string> = { q: "Search", location: "Area", type: "Type", minRent: "Min rent", maxRent: "Max rent", bedrooms: "Min rooms", sort: "Sort" };
          const display = key === "type" ? UNIT_TYPE_OPTIONS.find(option => option.value === value)?.label ?? value : key === "sort" ? ({ newest: "Newest", rent_asc: "Lowest rent", rent_desc: "Highest rent" } as Record<string, string>)[value!] ?? value : value;
          return <Link key={key} href={buildVacancyPageHref("/vacancies", 1, { ...filters.filterParams, [key]: undefined })} aria-label={`Remove ${labels[key]} filter: ${display}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm"><span>{labels[key]}: {display}</span><span aria-hidden="true">×</span></Link>;
        })}</div> : null}

        {databaseUnavailable ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm dark:border-white/12 dark:bg-[#111827] dark:text-[#d1d5db]">
            Vacancies are temporarily unavailable. Please refresh in a moment.
          </div>
        ) : listPage.total === 0 ? (
          <div className="space-y-5 rounded-xl border border-dashed border-slate-300 bg-white p-6 shadow-sm dark:border-white/15 dark:bg-[#111827]">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                No vacant units match that search yet.
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#d1d5db]">
                Try a different town, widen the rent range, or browse popular rental searches below.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularLandingLinks.slice(0, 12).map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white dark:border-white/12 dark:bg-white/[0.06] dark:text-[#f8fafc] dark:hover:border-white/24 dark:hover:bg-white/[0.10]"
                >
                  {item.title}
                </Link>
              ))}
            </div>
            <Link
              href="/vacancies"
              className="inline-flex min-h-10 items-center text-sm font-semibold text-slate-800 underline-offset-4 hover:underline dark:text-white"
            >
              View all vacancies
            </Link>
          </div>
        ) : (
          <VacancyListingGrid
            listings={listingCards}
            pagination={pagination}
            searchParams={filters.filterParams}
          />
        )}

        <details className="mt-10 rounded-2xl border border-border bg-card p-5">
          <summary className="min-h-11 cursor-pointer text-base font-semibold">Explore rentals by area and property type</summary>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                Popular rental searches
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#d1d5db]">
                Find homes, rooms, shops and apartments in the areas you’re considering.
              </p>
            </div>
            <Link
              href="/property-management-software-kenya"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-700 hover:text-slate-950 dark:text-[#d1d5db] dark:hover:text-white"
            >
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
        </details>
      </section>

      <PublicAccessFooter />
    </main>
  );
}
