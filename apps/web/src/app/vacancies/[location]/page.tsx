import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import type React from "react";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { ArrowLeft, Building2, Coins, ShieldCheck, Zap } from "lucide-react";
import { isTransientDatabaseError, retryTransientDatabaseOperation } from "@/lib/db/retry";
import { PUBLIC_VACANCIES_CACHE_TAG } from "@/lib/public-vacancy-cache";
import { publicVacancyImageUrl } from "@/lib/public-vacancy-image";
import {
  isPublicVacancyDatabaseError,
  PUBLIC_VACANCY_REVALIDATE_SECONDS,
} from "@/lib/public-vacancy-listings";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import {
  VacancyDetailBreadcrumb,
  VacancyDetailDescription,
  VacancyDetailGallery,
  VacancyDetailHighlights,
  VacancyDetailOverview,
  VacancyDetailRelated,
  VacancyDetailSidebar,
  vacancyDetailHighlightIcons,
} from "@/components/marketing/vacancy-detail-ui";
import VacanciesPage from "@/app/(marketing)/vacancies/page";
import { prisma } from "@/lib/prisma";
import { publicPageMetadata } from "@/lib/seo";
import { APP_URL } from "@/lib/sitemap-utils";
import {
  buildRentalLocationDescription,
  buildRentalLocationTitle,
  getPublicRentalLocation,
  locationLabel,
  publicRentalLocationPaths,
  resolvePublicRentalLocationHref,
} from "@/lib/public-rental-seo";
import { sendVacancyInquiryAction } from "./actions";
import { resolveVacancyUnitIdFromSlug } from "@/lib/public-vacancy-resolve";
import {
  isLegacyVacancySlug,
  isRawDatabaseId,
  resolvePublicListingHref,
  stripLegacyVacancySlug,
  vacancyOgImagePath,
  vacancyPublicSlug,
} from "@/lib/public-vacancy-slug";
import { ensureUnitPublicSlug } from "@/lib/public-vacancy-ensure-slug";
import {
  paginateItems,
  parsePositiveInt,
  PUBLIC_VACANCY_RELATED_PAGE_SIZE,
} from "@/lib/vacancy-pagination";
import { mapsSearchHref, telHref, whatsappHref } from "@/lib/vacancy-contact";

type Props = {
  params: Promise<{ location: string }>;
  searchParams?: Promise<{ sent?: string; error?: string; relatedPage?: string }>;
};

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || "KES";

const PUBLIC_VACANCY_ATTEMPTS = 2;
const PUBLIC_VACANCY_DELAY_MS = 250;

export const revalidate = 300;

export function generateStaticParams() {
  return publicRentalLocationPaths().map(({ location }) => ({ location }));
}

async function getVacancyUnit(slug: string) {
  const unitId = await resolveVacancyUnitIdFromSlug(slug);
  if (!unitId) return null;

  const unit = await retryTransientDatabaseOperation(
    () =>
      prisma.unit.findFirst({
        where: {
          id: unitId,
          isActive: true,
          deletedAt: null,
          status: "VACANT",
          isPubliclyListed: true,
          property: {
            isActive: true,
            deletedAt: null,
            org: {
              status: "ACTIVE",
              deletedAt: null,
            },
          },
        },
        include: {
          images: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
            select: { key: true, fileName: true },
          },
          building: { select: { name: true } },
          property: {
            select: {
              name: true,
              address: true,
              location: true,
              notes: true,
              org: { select: { name: true, phone: true, email: true } },
            },
          },
        },
      }),
    {
      attempts: PUBLIC_VACANCY_ATTEMPTS,
      delayMs: PUBLIC_VACANCY_DELAY_MS,
      label: `public-vacancy-detail:${unitId}`,
    },
  );

  if (!unit) return null;

  const publicSlug = await ensureUnitPublicSlug({
    id: unit.id,
    houseNo: unit.houseNo,
    publicSlug: unit.publicSlug,
    property: { name: unit.property.name },
  });

  return { ...unit, publicSlug };
}

function VacancyTemporarilyUnavailable() {
  return (
    <main className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <PublicAccessHeader active="vacancies" />

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
          <h1 className="text-xl font-semibold">Vacancy temporarily unavailable</h1>
          <p className="mt-2 text-sm leading-6">
            We could not load this vacancy right now. Please refresh in a moment or return to all vacancies.
          </p>
          <Link
            href="/vacancies"
            className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            View vacancies
          </Link>
        </div>
      </section>
      <PublicAccessFooter />
    </main>
  );
}

function getVacancyUnitCached(id: string) {
  return unstable_cache(
    () => getVacancyUnit(id),
    [`public-vacancy-detail:${id}`],
    {
      revalidate: PUBLIC_VACANCY_REVALIDATE_SECONDS,
      tags: [PUBLIC_VACANCIES_CACHE_TAG],
    },
  )();
}

async function getVacancyUnitOrUnavailable(id: string) {
  try {
    return { unit: await getVacancyUnitCached(id), databaseUnavailable: false };
  } catch (error) {
    if (!isPublicVacancyDatabaseError(error)) {
      throw error;
    }

    console.warn("Public vacancy detail is temporarily unavailable.");
    return { unit: null, databaseUnavailable: true };
  }
}

function JsonLdScript({ value }: { value: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(value) }}
    />
  );
}

type VacancyUnit = NonNullable<Awaited<ReturnType<typeof getVacancyUnit>>>;
type RelatedVacancyUnit = Awaited<ReturnType<typeof getRelatedVacancyUnits>>[number];
type VacancyDetailItem = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

async function getRelatedVacancyUnits(input: {
  currentUnitId: string;
  location?: string | null;
  unitType?: string | null;
}) {
  const location = input.location?.trim() || "";

  return retryTransientDatabaseOperation(
    () =>
      prisma.unit.findMany({
        where: {
          id: { not: input.currentUnitId },
          isActive: true,
          deletedAt: null,
          status: "VACANT",
          isPubliclyListed: true,
          ...(input.unitType ? { type: input.unitType as never } : {}),
          property: {
            isActive: true,
            deletedAt: null,
            org: {
              status: "ACTIVE",
              deletedAt: null,
            },
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
        orderBy: [{ updatedAt: "desc" }, { houseNo: "asc" }],
        take: 24,
        select: {
          id: true,
          houseNo: true,
          type: true,
          bedrooms: true,
          roomCount: true,
          rentAmount: true,
          publicSlug: true,
          images: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { key: true, fileName: true },
          },
          property: {
            select: {
              name: true,
              location: true,
              address: true,
            },
          },
        },
      }),
    {
      attempts: PUBLIC_VACANCY_ATTEMPTS,
      delayMs: PUBLIC_VACANCY_DELAY_MS,
      label: `related-vacancies:${input.currentUnitId}`,
    },
  );
}

function formatCurrency(value: unknown) {
  if (value == null) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

/**
 * `unstable_cache` rehydrates Prisma Date fields as ISO strings. Accept both
 * Date and string so JSON-LD never throws on cached vacancy detail reads.
 */
function toIsoDateTime(value: Date | string | null | undefined): string | undefined {
  if (value == null) return undefined;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function publicVacancyImageAbsolute(key: string | null | undefined) {
  const src = publicVacancyImageUrl(key);
  if (!src) return null;
  return src.startsWith("http") ? src : `${APP_URL}${src}`;
}

function buildTitle(unit: VacancyUnit) {
  return `${unit.property?.name ?? "Property"} · Unit ${unit.houseNo}`;
}

function buildDescription(unit: VacancyUnit) {
  const parts = [];
  if (unit.bedrooms != null) parts.push(`${unit.bedrooms} bedroom${unit.bedrooms === 1 ? "" : "s"}`);
  parts.push(unit.type.toLowerCase().replaceAll("_", " "));
  if (unit.property?.location) parts.push(`in ${unit.property.location}`);
  return parts.join(" ") || `${unit.type.toLowerCase()} available at ${unit.property?.name ?? "EstateDesk"}`;
}

function unitTypeLabel(type: string, bedrooms: number | null = null) {
  if (type === "APARTMENT" && bedrooms) return `${bedrooms} bedroom apartment`;
  return type.toLowerCase().replaceAll("_", " ");
}

function isUsefulAddress(value: string | null | undefined) {
  if (!value) return false;
  return /[A-Za-z]/.test(value);
}

function buildAddress(unit: VacancyUnit) {
  const address = unit.property?.address || unit.property?.location;
  if (!address) return undefined;
  return {
    "@type": "PostalAddress",
    streetAddress: unit.property?.address || address,
    addressLocality: unit.property?.location || undefined,
    addressCountry: "KE",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { location: id } = await params;
  const rentalLocation = getPublicRentalLocation(id);

  if (rentalLocation) {
    return publicPageMetadata({
      title: buildRentalLocationTitle(id),
      description: buildRentalLocationDescription(id),
      path: `/vacancies/${id}`,
      keywords: [
        `houses for rent in ${rentalLocation.label}`,
        `vacant houses ${rentalLocation.label}`,
        `apartments for rent in ${rentalLocation.label}`,
        `bedsitters in ${rentalLocation.label}`,
        `rental units ${rentalLocation.label}`,
      ],
    });
  }

  const { unit, databaseUnavailable } = await getVacancyUnitOrUnavailable(id);
  if (databaseUnavailable) {
    return {
      title: "Vacancy temporarily unavailable",
      description: "This vacancy could not be loaded right now. Please try again shortly.",
      robots: { index: false, follow: true },
    };
  }

  if (!unit) {
    return {
      title: "Vacancy not found",
      description: "The requested vacancy was not found.",
    };
  }

  const title = buildTitle(unit);
  const description = buildDescription(unit);
  const publicSlug =
    unit.publicSlug?.trim() ||
    vacancyPublicSlug({
      propertyName: unit.property.name,
      houseNo: unit.houseNo,
    });
  const url = `${APP_URL}${resolvePublicListingHref({
    publicSlug,
    propertyName: unit.property.name,
    houseNo: unit.houseNo,
  })}`;
  const primaryImage = publicVacancyImageAbsolute(unit.images[0]?.key);
  const image = primaryImage ?? `${APP_URL}${vacancyOgImagePath(publicSlug)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "EstateDesk",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: { index: true, follow: true },
  };
}

export default async function VacancyDetail({ params, searchParams }: Props) {
  const { location: id } = await params;
  const rentalLocation = getPublicRentalLocation(id);

  if (rentalLocation) {
    return (
      <VacanciesPage
        searchParams={Promise.resolve({
          location: locationLabel(id),
        })}
      />
    );
  }

  const statusParams = await searchParams;
  const relatedPage = parsePositiveInt(statusParams?.relatedPage);
  const { unit, databaseUnavailable } = await getVacancyUnitOrUnavailable(id);
  if (databaseUnavailable) return <VacancyTemporarilyUnavailable />;
  if (!unit) notFound();
  const publicSlug =
    unit.publicSlug?.trim() ||
    vacancyPublicSlug({
      propertyName: unit.property.name,
      houseNo: unit.houseNo,
    });
  const canonicalSlug = stripLegacyVacancySlug(id);
  if (
    id !== publicSlug ||
    isLegacyVacancySlug(id) ||
    isRawDatabaseId(id) ||
    canonicalSlug !== publicSlug
  ) {
    redirect(`/vacancies/${publicSlug}`);
  }
  let relatedVacancies: RelatedVacancyUnit[] = [];

  try {
    relatedVacancies = await getRelatedVacancyUnits({
      currentUnitId: unit.id,
      location: unit.property?.location ?? unit.property?.address,
      unitType: unit.type,
    });

    // Fall back to same-type nationwide if local pool is thin.
    if (relatedVacancies.length < 4) {
      const broader = await getRelatedVacancyUnits({
        currentUnitId: unit.id,
        unitType: unit.type,
      });
      const seen = new Set(relatedVacancies.map((item) => item.id));
      for (const item of broader) {
        if (seen.has(item.id)) continue;
        relatedVacancies.push(item);
        seen.add(item.id);
      }
    }
  } catch (error) {
    if (!isPublicVacancyDatabaseError(error)) {
      throw error;
    }

    console.warn("Related public vacancies are temporarily unavailable.");
  }

  const title = buildTitle(unit);
  const description = buildDescription(unit);
  const url = `${APP_URL}${resolvePublicListingHref({
    publicSlug,
    propertyName: unit.property.name,
    houseNo: unit.houseNo,
  })}`;
  const place = unit.property?.location ?? unit.property?.address ?? unit.property?.name ?? "Location not listed";
  const locationHref = resolvePublicRentalLocationHref(place);
  const detailBasePath = `/vacancies/${publicSlug}`;
  const roomLabel = unit.roomCount ?? unit.bedrooms;
  const rentLabel = formatCurrency(unit.rentAmount);
  const serviceChargeLabel = unit.serviceCharge
    ? formatCurrency(unit.serviceCharge)
    : "No service charge";
  const depositLabel = unit.depositAmount ? formatCurrency(unit.depositAmount) : null;
  const viewingLabel = unit.viewingFeeRequired
    ? unit.viewingFeeAmount
      ? formatCurrency(unit.viewingFeeAmount)
      : "Fee applies"
    : "Free";
  const viewingBadgeLabel = unit.viewingFeeRequired
    ? unit.viewingFeeAmount
      ? `Viewing ${formatCurrency(unit.viewingFeeAmount)}`
      : "Viewing fee"
    : "Free viewing";
  const highlightIcons = vacancyDetailHighlightIcons();
  const detailCandidates: Array<VacancyDetailItem | null> = [
    roomLabel
      ? { label: "Rooms", value: String(roomLabel), icon: highlightIcons.rooms }
      : null,
    {
      label: "Bathrooms",
      value: unit.bathrooms ? String(unit.bathrooms) : "Not listed",
      icon: highlightIcons.baths,
    },
    {
      label: "Unit type",
      value: unitTypeLabel(unit.type, unit.bedrooms),
      icon: highlightIcons.type,
    },
    { label: "Location", value: place, icon: highlightIcons.location },
    { label: "Viewing", value: viewingLabel, icon: highlightIcons.viewing },
    depositLabel
      ? { label: "Deposit", value: depositLabel, icon: <Coins className="h-4 w-4" /> }
      : null,
    unit.hasBalcony ? { label: "Balcony", value: "Available", icon: <Building2 className="h-4 w-4" /> } : null,
    unit.electricityBilling ? { label: "Electricity", value: unit.electricityBilling, icon: <Zap className="h-4 w-4" /> } : null,
    unit.serviceCharge
      ? { label: "Service charge", value: formatCurrency(unit.serviceCharge), icon: <Coins className="h-4 w-4" /> }
      : null,
    unit.garbageFee ? { label: "Garbage fee", value: formatCurrency(unit.garbageFee), icon: <Coins className="h-4 w-4" /> } : null,
    unit.securityFee ? { label: "Security", value: formatCurrency(unit.securityFee), icon: <ShieldCheck className="h-4 w-4" /> } : null,
    unit.floorArea ? { label: "Floor area", value: `${unit.floorArea} m2`, icon: <Building2 className="h-4 w-4" /> } : null,
  ];
  const highlights = detailCandidates.filter((item): item is VacancyDetailItem => Boolean(item));
  const addressSchema = buildAddress(unit);
  const hasPhotos = unit.images.length > 0;
  const gallery = unit.images;
  const orgPhone = unit.property?.org.phone ?? null;
  const callHref = orgPhone
    ? telHref(orgPhone, `mailto:${unit.property?.org.email ?? "info@estatedesk.com"}`)
    : `mailto:${unit.property?.org.email ?? "info@estatedesk.com"}`;
  const shareText = `${title} is vacant in ${place}. Rent: ${rentLabel}. View details on EstateDesk.`;
  const managerWhatsapp = whatsappHref(
    orgPhone,
    `Hi, I'm interested in ${title} (${place}). ${url}`,
  );
  const mapsHref = mapsSearchHref(
    [unit.property?.address, unit.property?.location, unit.property?.name]
      .filter(Boolean)
      .join(", "),
  );
  const boundInquiryAction = sendVacancyInquiryAction.bind(null, publicSlug);
  const propertyNotes = unit.property?.notes?.trim() || null;
  const unitNotes = unit.notes?.trim() || null;
  const relatedListingCards = relatedVacancies.map((listing) => {
    const relatedPlace =
      listing.property.location ?? listing.property.address ?? listing.property.name;
    const rooms = listing.roomCount ?? listing.bedrooms;

    return {
      id: listing.id,
      href: resolvePublicListingHref({
        publicSlug: listing.publicSlug,
        propertyName: listing.property.name,
        houseNo: listing.houseNo,
      }),
      imageSrc: listing.images[0]?.key ? publicVacancyImageUrl(listing.images[0].key) : null,
      hasImage: Boolean(listing.images[0]?.key),
      imageAlt:
        listing.images[0]?.fileName ?? `${listing.property.name} Unit ${listing.houseNo}`,
      propertyName: listing.property.name,
      houseNo: listing.houseNo,
      place: relatedPlace,
      rentLabel: formatCurrency(listing.rentAmount),
      roomsLabel: rooms
        ? `${rooms} room${rooms === 1 ? "" : "s"}`
        : unitTypeLabel(listing.type, listing.bedrooms),
    };
  });
  const { items: visibleRelatedListingCards, pagination: relatedPagination } = paginateItems(
    relatedListingCards,
    relatedPage,
    PUBLIC_VACANCY_RELATED_PAGE_SIZE,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Offer",
        name: title,
        description,
        url,
        price: unit.rentAmount ? Number(unit.rentAmount) : undefined,
        priceCurrency: DEFAULT_CURRENCY,
        availability: "https://schema.org/InStock",
        itemOffered: {
          "@type": "Accommodation",
          name: title,
          description,
          numberOfRooms: unit.roomCount ?? unit.bedrooms ?? undefined,
          numberOfBathrooms: unit.bathrooms ?? undefined,
          floorSize: unit.floorArea
            ? { "@type": "QuantitativeValue", value: Number(unit.floorArea), unitCode: "MTK" }
            : undefined,
          address: addressSchema,
          image: hasPhotos
            ? gallery.map((asset) => publicVacancyImageAbsolute(asset.key)).filter(Boolean)
            : [`${APP_URL}${vacancyOgImagePath(publicSlug)}`],
          url,
        },
        seller: {
          "@type": "Organization",
          name: unit.property?.org.name,
          telephone: unit.property?.org.phone ?? undefined,
          email: unit.property?.org.email ?? undefined,
        },
        dateModified: toIsoDateTime(unit.updatedAt),
      },
      {
        "@type": "RealEstateListing",
        name: title,
        description,
        url,
        datePosted: toIsoDateTime(unit.updatedAt),
        image: hasPhotos
          ? gallery.map((asset) => publicVacancyImageAbsolute(asset.key)).filter(Boolean)
          : [`${APP_URL}${vacancyOgImagePath(publicSlug)}`],
        offers: {
          "@type": "Offer",
          price: unit.rentAmount ? Number(unit.rentAmount) : undefined,
          priceCurrency: DEFAULT_CURRENCY,
          availability: "https://schema.org/InStock",
          url,
        },
        address: addressSchema,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Vacancies",
            item: `${APP_URL}/vacancies`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: place,
            item: `${APP_URL}${locationHref}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `Unit ${unit.houseNo}`,
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <main className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <PublicAccessHeader active="vacancies" />
      <VacancyDetailBreadcrumb place={place} houseNo={unit.houseNo} locationHref={locationHref} />

      <article className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section className="space-y-6">
            <VacancyDetailGallery
              gallery={gallery}
              title={title}
              rentLabel={rentLabel}
              viewingLabel={viewingBadgeLabel}
              imageUrl={publicVacancyImageUrl}
              hasPhotos={hasPhotos}
            />
            <VacancyDetailOverview
              managerName={unit.property?.org.name ?? "Property manager"}
              propertyName={unit.property?.name ?? "Property"}
              houseNo={unit.houseNo}
              place={place}
              description={description}
            />
            <VacancyDetailHighlights highlights={highlights} />
            {isUsefulAddress(unit.property?.address) || propertyNotes || unitNotes ? (
              <VacancyDetailDescription
                address={isUsefulAddress(unit.property?.address) ? unit.property?.address : null}
                propertyNotes={propertyNotes}
                unitNotes={unitNotes}
              />
            ) : null}
          </section>

          <VacancyDetailSidebar
            rentLabel={rentLabel}
            serviceChargeLabel={serviceChargeLabel}
            depositLabel={depositLabel}
            viewingLabel={viewingLabel}
            managerName={unit.property?.org.name ?? "Property manager"}
            callHref={callHref}
            whatsappHref={managerWhatsapp}
            mapsHref={mapsHref}
            shareUrl={url}
            shareTitle={title}
            shareText={shareText}
            inquiry={{
              action: boundInquiryAction,
              defaultMessage: `I am interested in ${title} in ${place}. Please contact me about viewing.`,
              defaultPreferredLocation: place !== "Location not listed" ? place : undefined,
              sent: statusParams?.sent,
              error: statusParams?.error,
            }}
          />
        </div>
      </article>

      <VacancyDetailRelated
        listings={visibleRelatedListingCards}
        pagination={relatedPagination}
        basePath={detailBasePath}
      />

      <PublicAccessFooter />
      <JsonLdScript value={jsonLd} />
    </main>
  );
}
