import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/sitemap-utils";

type Props = {
  params: Promise<{ id: string }>;
};

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || "KES";

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
      building: { select: { name: true } },
      property: { select: { name: true, address: true, location: true, notes: true } },
    },
  });
}

type VacancyUnit = NonNullable<Awaited<ReturnType<typeof getVacancyUnit>>>;

function buildTitle(unit: VacancyUnit) {
  const buildingLabel = unit.building?.name ? `${unit.building.name} - ` : "";
  return `${buildingLabel}${unit.property?.name ?? "Property"} - ${unit.houseNo}`;
}

function buildDescription(unit: VacancyUnit) {
  const parts = [];
  if (unit.bedrooms != null) parts.push(`${unit.bedrooms} bedroom${unit.bedrooms === 1 ? "" : "s"}`);
  parts.push(unit.type.toLowerCase());
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
  const image = `${APP_URL}/api/og/vacancy/${unit.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "EstateDesk",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function VacancyDetail({ params }: Props) {
  const { id } = await params;
  const unit = await getVacancyUnit(id);
  if (!unit) {
    return notFound();
  }

  const title = buildTitle(unit);
  const description = buildDescription(unit);
  const url = `${APP_URL}/vacancies/${unit.id}`;
  const image = `${APP_URL}/api/og/vacancy/${unit.id}`;
  const addressSchema = buildAddress(unit);
  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I inquire about this vacancy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Contact EstateDesk through the website or request a viewing using the vacancy details page.",
        },
      },
      {
        "@type": "Question",
        name: "Is utilities included in the monthly rent?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The monthly rent shown is for the unit only; utility billing is determined by the property owner or manager.",
        },
      },
      {
        "@type": "Question",
        name: "Can I schedule a viewing before moving in?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, schedule a viewing through EstateDesk and confirm availability before submitting an application.",
        },
      },
    ],
  };

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
          numberOfRooms: unit.bedrooms ?? undefined,
          numberOfBathrooms: unit.bathrooms ?? undefined,
          floorSize: unit.floorArea
            ? {
                "@type": "QuantitativeValue",
                value: Number(unit.floorArea),
                unitCode: "MTK",
              }
            : undefined,
          address: addressSchema,
          image: [image],
          url,
        },
        dateModified: unit.updatedAt.toISOString(),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: APP_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: title,
            item: url,
          },
        ],
      },
      faqSchema,
    ],
  };

  return (
    <main className="mx-auto max-w-4xl py-10 px-4">
      <article className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{unit.property?.name}</p>
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="max-w-2xl text-lg text-slate-600">{description}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">Rent</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {unit.rentAmount ? `${Number(unit.rentAmount).toLocaleString()} ${DEFAULT_CURRENCY}` : "Contact"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">Current availability</p>
            <p className="mt-2 text-lg text-slate-900">Vacant now</p>
            <p className="mt-1 text-sm text-slate-500">Updated {unit.updatedAt.toISOString().slice(0, 10)}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {unit.bedrooms != null ? (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Bedrooms</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{unit.bedrooms}</p>
            </div>
          ) : null}
          {unit.bathrooms != null ? (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Bathrooms</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{unit.bathrooms}</p>
            </div>
          ) : null}
          {unit.floorArea != null ? (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Floor area</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{unit.floorArea} m2</p>
            </div>
          ) : null}
        </div>

        {unit.property?.address || unit.property?.notes ? (
          <section className="rounded-2xl border border-slate-200 p-6">
            {unit.property?.address ? <p className="text-sm text-slate-500">Address</p> : null}
            {unit.property?.address ? <p className="mt-2 text-lg font-semibold text-slate-900">{unit.property.address}</p> : null}
            {unit.property?.notes ? <p className="mt-4 text-slate-600">{unit.property.notes}</p> : null}
          </section>
        ) : null}

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </article>
    </main>
  );
}
