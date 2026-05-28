import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type React from "react";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  Coins,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Zap,
} from "lucide-react";
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
  return prisma.unit.findFirst({
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
  });
}

type VacancyUnit = NonNullable<Awaited<ReturnType<typeof getVacancyUnit>>>;

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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.14em]">{label}</p>
      </div>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const unit = await getVacancyUnit(id);
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
  const unit = await getVacancyUnit(id);
  if (!unit) notFound();

  const title = buildTitle(unit);
  const description = buildDescription(unit);
  const url = `${APP_URL}/vacancies/${unit.id}`;
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
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/vacancies" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            Vacancies
          </Link>
          <Link href="/register" className="inline-flex min-h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">
            Create account
          </Link>
        </div>
      </header>

      <article className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-5">
          <div className="grid gap-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:aspect-[16/10]">
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
                  <div key={asset.key} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <Image src={imageUrl(asset.key)} alt={asset.fileName ?? title} fill sizes="25vw" className="object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-500">{unit.property?.org.name}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4" />
                Vacant now
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                <Coins className="h-4 w-4" />
                {unit.viewingFeeRequired ? `Viewing fee ${formatCurrency(unit.viewingFeeAmount)}` : "Free viewing"}
              </span>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailCard label="Rent" value={formatCurrency(unit.rentAmount)} icon={<Coins className="h-4 w-4" />} />
            <DetailCard label="Rooms" value={String(unit.roomCount ?? unit.bedrooms ?? "—")} icon={<BedDouble className="h-4 w-4" />} />
            <DetailCard label="Bathrooms" value={String(unit.bathrooms ?? "—")} icon={<Bath className="h-4 w-4" />} />
            <DetailCard label="Balcony" value={unit.hasBalcony ? "Available" : "Not listed"} icon={<Building2 className="h-4 w-4" />} />
            <DetailCard label="Electricity" value={unit.electricityBilling || "Not listed"} icon={<Zap className="h-4 w-4" />} />
            <DetailCard label="Service charge" value={unit.serviceCharge ? formatCurrency(unit.serviceCharge) : "Included/none"} icon={<Coins className="h-4 w-4" />} />
            <DetailCard label="Garbage fee" value={unit.garbageFee ? formatCurrency(unit.garbageFee) : "Included/none"} icon={<Coins className="h-4 w-4" />} />
            <DetailCard label="Security" value={unit.securityFee ? formatCurrency(unit.securityFee) : "Included/none"} icon={<ShieldCheck className="h-4 w-4" />} />
            <DetailCard label="Floor area" value={unit.floorArea ? `${unit.floorArea} m2` : "Not listed"} icon={<Building2 className="h-4 w-4" />} />
          </section>

          {unit.property?.address || unit.property?.notes || unit.notes ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">Property description</p>
              </div>
              {unit.property?.address ? <p className="mt-3 text-sm font-semibold text-slate-950">{unit.property.address}</p> : null}
              {unit.property?.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{unit.property.notes}</p> : null}
              {unit.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{unit.notes}</p> : null}
            </section>
          ) : null}
        </section>

        <aside id="enquire" className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <a
            href={callHref}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"
          >
            <Phone className="h-4 w-4" />
            Call landlord/agent
          </a>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Enquire about this property</h2>
            <p className="mt-1 text-sm text-slate-600">
              Your message goes straight to the landlord or organization workspace.
            </p>

            {statusParams?.sent ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
                Enquiry sent successfully.
              </div>
            ) : null}

            <form action={boundInquiryAction} className="mt-4 space-y-3">
              <input name="fullName" required placeholder="Full name" className="min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-500" />
              <input name="phone" required placeholder="Phone number" className="min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-500" />
              <input name="email" type="email" placeholder="Email address" className="min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-500" />
              <textarea
                name="message"
                required
                rows={4}
                defaultValue={`I am interested in ${title}. Please contact me about viewing.`}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-500"
              />
              <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">
                <Send className="h-4 w-4" />
                Send enquiry
              </button>
            </form>
          </section>
        </aside>

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </article>
    </main>
  );
}
