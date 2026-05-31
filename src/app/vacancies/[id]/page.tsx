import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type React from "react";
import { Prisma } from "@prisma/client";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  Coins,
  LogIn,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { isTransientDatabaseError, retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/sitemap-utils";
import { sendVacancyInquiryAction } from "./actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ sent?: string; error?: string }>;
};

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || "KES";
const FALLBACK_IMAGE = "/images/og-vacancy.svg";

export const dynamic = "force-dynamic";

async function getVacancyUnit(id: string) {
  return retryTransientDatabaseOperation(
    () =>
      prisma.unit.findFirst({
        where: {
          id,
          isActive: true,
          deletedAt: null,
          status: "VACANT",
          property: {
            isActive: true,
            deletedAt: null,
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
    { label: `public-vacancy-detail:${id}` },
  );
}

function VacancyTemporarilyUnavailable() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/vacancies" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Vacancies
          </Link>
          <Link href="/register" className="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
            Create account
          </Link>
        </div>
      </header>

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
    </main>
  );
}

async function getVacancyUnitOrUnavailable(id: string) {
  try {
    return { unit: await getVacancyUnit(id), databaseUnavailable: false };
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

async function getRelatedVacancyUnits(currentUnitId: string) {
  return retryTransientDatabaseOperation(
    () =>
      prisma.unit.findMany({
        where: {
          id: { not: currentUnitId },
          isActive: true,
          deletedAt: null,
          status: "VACANT",
          property: {
            isActive: true,
            deletedAt: null,
          },
        },
        orderBy: [{ updatedAt: "desc" }, { houseNo: "asc" }],
        take: 32,
        select: {
          id: true,
          houseNo: true,
          type: true,
          bedrooms: true,
          roomCount: true,
          rentAmount: true,
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
    { label: `related-vacancies:${currentUnitId}` },
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

function imageUrl(key: string | null | undefined) {
  if (!key) return FALLBACK_IMAGE;
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}

function buildTitle(unit: VacancyUnit) {
  const buildingLabel = unit.building?.name ? `${unit.building.name} - ` : "";
  return `${buildingLabel}${unit.property?.name ?? "Property"} - ${unit.houseNo}`;
}

function buildDescription(unit: VacancyUnit) {
  const parts = [];
  if (unit.bedrooms != null) parts.push(`${unit.bedrooms} bedroom${unit.bedrooms === 1 ? "" : "s"}`);
  parts.push(unit.type.toLowerCase().replaceAll("_", " "));
  if (unit.property?.location) parts.push(`in ${unit.property.location}`);
  return parts.join(" ") || `${unit.type.toLowerCase()} available at ${unit.property?.name ?? "EstateDesk"}`;
}

function unitTypeLabel(type: string) {
  return type.toLowerCase().replaceAll("_", " ");
}

function isPublicVacancyDatabaseError(error: unknown) {
  if (isTransientDatabaseError(error)) return true;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021" || error.code === "P2022";
  }

  return false;
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

function buildLoginHref(returnTo: string) {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

function shuffleVacancies<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function RelatedVacancyCard({ listing }: { listing: RelatedVacancyUnit }) {
  const place = listing.property.location ?? listing.property.address ?? listing.property.name;
  const rooms = listing.roomCount ?? listing.bedrooms;
  const hasImage = Boolean(listing.images[0]?.key);

  return (
    <Link
      href={`/vacancies/${listing.id}`}
      className="group grid min-w-0 grid-cols-[5rem_1fr] gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20 dark:hover:bg-slate-800 sm:grid-cols-1"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 sm:aspect-[4/3]">
        {hasImage ? (
          <Image
            src={imageUrl(listing.images[0]?.key)}
            alt={listing.images[0]?.fileName ?? `${listing.property.name} Unit ${listing.houseNo}`}
            fill
            sizes="(min-width: 1024px) 14vw, (min-width: 640px) 45vw, 35vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Building2 className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 self-center sm:self-auto">
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-950 dark:text-white">
          {listing.property.name} · Unit {listing.houseNo}
        </h3>
        <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">{place}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-slate-950 dark:text-white">
            {formatCurrency(listing.rentAmount)}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {rooms ? `${rooms} rm` : unitTypeLabel(listing.type)}
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function DetailCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.14em]">{label}</p>
      </div>
      <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function CompactFact({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
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
  const url = `${APP_URL}/vacancies/${unit.id}`;
  const image = unit.images[0]?.key ? `${APP_URL}${imageUrl(unit.images[0].key)}` : `${APP_URL}/api/og/vacancy/${unit.id}`;

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
  const { id } = await params;
  const statusParams = await searchParams;
  const { unit, databaseUnavailable } = await getVacancyUnitOrUnavailable(id);
  if (databaseUnavailable) return <VacancyTemporarilyUnavailable />;
  if (!unit) notFound();
  let relatedVacancies: RelatedVacancyUnit[] = [];

  try {
    relatedVacancies = shuffleVacancies(await getRelatedVacancyUnits(unit.id)).slice(0, 12);
  } catch (error) {
    if (!isPublicVacancyDatabaseError(error)) {
      throw error;
    }

    console.warn("Related public vacancies are temporarily unavailable.");
  }

  const title = buildTitle(unit);
  const description = buildDescription(unit);
  const url = `${APP_URL}/vacancies/${unit.id}`;
  const loginHref = buildLoginHref(`/vacancies/${unit.id}`);
  const place = unit.property?.location ?? unit.property?.address ?? unit.property?.name ?? "Location not listed";
  const roomLabel = unit.roomCount ?? unit.bedrooms;
  const detailCandidates: Array<VacancyDetailItem | null> = [
    roomLabel ? { label: "Rooms", value: String(roomLabel), icon: <BedDouble className="h-4 w-4" /> } : null,
    unit.bathrooms ? { label: "Bathrooms", value: String(unit.bathrooms), icon: <Bath className="h-4 w-4" /> } : null,
    unit.hasBalcony ? { label: "Balcony", value: "Available", icon: <Building2 className="h-4 w-4" /> } : null,
    unit.electricityBilling ? { label: "Electricity", value: unit.electricityBilling, icon: <Zap className="h-4 w-4" /> } : null,
    unit.serviceCharge ? { label: "Service charge", value: formatCurrency(unit.serviceCharge), icon: <Coins className="h-4 w-4" /> } : null,
    unit.garbageFee ? { label: "Garbage fee", value: formatCurrency(unit.garbageFee), icon: <Coins className="h-4 w-4" /> } : null,
    unit.securityFee ? { label: "Security", value: formatCurrency(unit.securityFee), icon: <ShieldCheck className="h-4 w-4" /> } : null,
    unit.floorArea ? { label: "Floor area", value: `${unit.floorArea} m2`, icon: <Building2 className="h-4 w-4" /> } : null,
  ];
  const meaningfulDetails = detailCandidates.filter(
    (item): item is VacancyDetailItem => Boolean(item),
  );
  const image = unit.images[0]?.key ? `${APP_URL}${imageUrl(unit.images[0].key)}` : `${APP_URL}/api/og/vacancy/${unit.id}`;
  const addressSchema = buildAddress(unit);
  const gallery = unit.images.length > 0 ? unit.images : [{ key: FALLBACK_IMAGE, fileName: title }];
  const callHref = unit.property?.org.phone ? `tel:${unit.property.org.phone}` : `mailto:${unit.property?.org.email ?? "info@estatedesk.com"}`;
  const boundInquiryAction = sendVacancyInquiryAction.bind(null, unit.id);

  const jsonLd = {
    "@context": "https://schema.org",
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
      image: [image],
      url,
    },
    dateModified: unit.updatedAt.toISOString(),
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/95 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Link href="/vacancies" className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl pr-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Vacancies
          </Link>
          <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
            <Link href={loginHref} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
              <LogIn className="h-4 w-4" />
              <span className="truncate">Sign in</span>
            </Link>
            <Link href="/register" className="inline-flex min-h-10 min-w-0 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
              <span className="truncate">Create account</span>
            </Link>
          </div>
        </div>
      </header>

      <article className="mx-auto grid max-w-screen-2xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(34rem,0.95fr)] lg:px-8">
        <section className="space-y-5">
          <div className="grid gap-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-800 sm:aspect-[16/10]">
              <Image
                src={imageUrl(gallery[0]?.key)}
                alt={gallery[0]?.fileName ?? title}
                fill
                priority
                sizes="(min-width: 1024px) 65vw, 100vw"
                className="object-cover"
              />
            </div>
            {gallery.length > 1 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {gallery.slice(1, 5).map((asset) => (
                  <div key={asset.key} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-800">
                    <Image src={imageUrl(asset.key)} alt={asset.fileName ?? title} fill sizes="25vw" className="object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                    Vacant now
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                    {unit.viewingFeeRequired ? `Viewing fee ${formatCurrency(unit.viewingFeeAmount)}` : "Free viewing"}
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{unit.property?.org.name}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  {unit.property?.name ?? "Property"} · Unit {unit.houseNo}
                </h1>
                <div className="mt-3 flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{place}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CompactFact label="Rent" value={formatCurrency(unit.rentAmount)} icon={<Coins className="h-4 w-4" />} />
            <CompactFact label="Unit type" value={unitTypeLabel(unit.type)} icon={<Building2 className="h-4 w-4" />} />
            <CompactFact label="Location" value={place} icon={<MapPin className="h-4 w-4" />} />
            <CompactFact label="Viewing" value={unit.viewingFeeRequired ? formatCurrency(unit.viewingFeeAmount) : "Free"} icon={<ShieldCheck className="h-4 w-4" />} />
          </section>

          {meaningfulDetails.length > 0 ? (
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {meaningfulDetails.map((detail) => (
                <DetailCard
                  key={detail.label}
                  label={detail.label}
                  value={detail.value}
                  icon={detail.icon}
                />
              ))}
            </section>
          ) : null}

          {isUsefulAddress(unit.property?.address) || unit.property?.notes || unit.notes ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">Property description</p>
              </div>
              {isUsefulAddress(unit.property?.address) ? <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">{unit.property?.address}</p> : null}
              {unit.property?.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{unit.property.notes}</p> : null}
              {unit.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{unit.notes}</p> : null}
            </section>
          ) : null}
        </section>

        <aside id="enquire" className="grid gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100svh-2rem)] lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.8fr)] lg:self-start">
          <div className="space-y-4">
            <a
              href={callHref}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
            >
              <Phone className="h-4 w-4" />
              Call landlord/agent
            </a>

            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Enquire about this property</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Your message goes straight to the landlord or organization workspace.
              </p>

              {statusParams?.sent ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  Enquiry sent successfully.
                </div>
              ) : null}

              <form action={boundInquiryAction} className="mt-4 space-y-3">
                <input name="fullName" required placeholder="Full name" className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-white/30" />
                <input name="phone" required placeholder="Phone number" className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-white/30" />
                <input name="email" type="email" placeholder="Email address" className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-white/30" />
                <textarea
                  name="message"
                  required
                  rows={4}
                  defaultValue={`I am interested in ${title}. Please contact me about viewing.`}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-white/30"
                />
                <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                  <Send className="h-4 w-4" />
                  Send enquiry
                </button>
              </form>
            </section>
          </div>

          {relatedVacancies.length > 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/70 lg:max-h-[calc(100svh-2rem)] lg:overflow-y-auto">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Related properties</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mixed vacant units you may also like.</p>
                </div>
                <Link href="/vacancies" className="text-xs font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                  All
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {relatedVacancies.map((related) => (
                  <RelatedVacancyCard key={related.id} listing={related} />
                ))}
              </div>
            </section>
          ) : null}
        </aside>

        <JsonLdScript value={jsonLd} />
      </article>
    </main>
  );
}
