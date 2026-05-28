import Link from "next/link";
import Image from "next/image";
import { Building2, Home, MapPin, ShieldCheck, UserCircle2 } from "lucide-react";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Vacant Houses in Kenya",
  description:
    "Browse available rental houses and vacant units published through EstateDesk by landlords and property managers in Kenya.",
  path: "/vacancies",
});

type Vacancy = {
  id: string;
  houseNumber: string;
  bedrooms: number | null;
  location: string;
  property: string;
  building: string | null;
  type: string;
  price: number;
  currency: string;
};

type VacantHousesResponse = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  count: number;
  houses: Vacancy[];
};

const sampleListings: Array<Vacancy & { badge: string; description: string; image: string }> = [
  {
    id: "sample-1",
    houseNumber: "A1",
    bedrooms: 3,
    location: "Lavington, Nairobi",
    property: "Garden Court House",
    building: null,
    type: "3 BR House",
    price: 55000,
    currency: "KES",
    badge: "Landlord",
    description: "Bright family home with safe garden, backup water, and guest suite.",
    image: "/images/listing-1.jpg",
  },
  {
    id: "sample-2",
    houseNumber: "B2",
    bedrooms: 4,
    location: "Runda, Nairobi",
    property: "Riverside Villa",
    building: null,
    type: "4 BR Villa",
    price: 120000,
    currency: "KES",
    badge: "Agency",
    description: "Modern villa with private pool, secure estate access, and parking.",
    image: "/images/listing-2.jpg",
  },
  {
    id: "sample-3",
    houseNumber: "C3",
    bedrooms: 2,
    location: "Kilimani, Nairobi",
    property: "Parkside Bungalow",
    building: null,
    type: "2 BR Bungalow",
    price: 37000,
    currency: "KES",
    badge: "Landlord",
    description: "Cozy bungalow near schools and shopping with polished floors.",
    image: "/images/listing-3.jpg",
  },
];

async function getVacantHomes() {
  const apiKey = process.env.VACANT_HOUSES_API_KEY;

  if (!apiKey) {
    return null;
  }

  const rootUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

  try {
    const response = await fetch(`${rootUrl}/api/public/vacant-houses`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as VacantHousesResponse;
  } catch {
    return null;
  }
}

export default async function VacanciesPage() {
  const data = await getVacantHomes();
  const isPublicApiLive = Boolean(data?.houses?.length);
  const listingsToRender =
    data?.houses?.map((house) => ({
      ...house,
      badge: "Landlord",
      description: `${house.bedrooms ?? ""} bedroom ${house.type.toLowerCase()} in ${house.location}`,
      image: "/images/listing-1.jpg",
    })) ?? sampleListings;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Browse without signing in
              </p>

              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Vacant homes for house hunters, no onboarding required.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                Visitors can explore available properties, view landlord and agency badges,
                and contact sellers directly — all without creating an account.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/vacancies"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View listings
                </Link>
                <a
                  href="mailto:info@estatedesk.com?subject=Vacant%20home%20inquiry"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400"
                >
                  Contact landlord/agency
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-slate-100 p-6">
                <div className="flex items-center gap-3 text-slate-900">
                  <Home className="h-6 w-6" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                      Available units
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {isPublicApiLive ? data?.count : sampleListings.length} ready now
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-100 p-6">
                <div className="flex items-center gap-3 text-slate-900">
                  <UserCircle2 className="h-6 w-6" />
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                      Trusted hosts
                    </p>
                    <p className="mt-1 text-2xl font-semibold">Landlords & agencies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!isPublicApiLive ? (
        <div className="mx-auto max-w-7xl px-6 py-4 text-sm text-slate-700">
          Showing sample listings because server-side public API access is not configured.
          Set <span className="font-semibold">VACANT_HOUSES_API_KEY</span> in your environment
          to display live vacant homes from the backend.
        </div>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Vacant homes
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Available houses and apartments in the neighbourhood.
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            House hunters can browse property details and contact the owner or agent directly.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {listingsToRender.map((listing) => (
            <article
              key={listing.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] bg-slate-200">
                <Image
                  src={listing.image}
                  alt={listing.property}
                  width={640}
                  height={480}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Building2 className="h-5 w-5" />
                    <span className="text-sm font-semibold">{listing.type}</span>
                  </div>
                  <span
                    className={
                      listing.badge === "Agency"
                        ? "rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700"
                        : "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                    }
                  >
                    {listing.badge}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-semibold text-slate-950">
                  {listing.property}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{listing.description}</p>

                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-lg font-semibold text-slate-950">
                    {listing.price.toLocaleString("en-KE", {
                      style: "currency",
                      currency: listing.currency,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <a
                    href="mailto:info@estatedesk.com?subject=Inquiry%20about%20vacant%20home"
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
