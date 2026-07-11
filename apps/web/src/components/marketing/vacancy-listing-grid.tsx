import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Building2, MapPin, Phone } from "lucide-react";
import { VacancyPaginationNav } from "@/components/marketing/vacancy-pagination-nav";
import { VacancyShareActions } from "@/components/marketing/vacancy-share-actions";
import type { VacancyPaginationState } from "@/lib/vacancy-pagination";

export type VacancyListingCard = {
  id: string;
  href: string;
  imageSrc: string | null;
  hasImage: boolean;
  imageAlt: string;
  managerName: string;
  propertyName: string;
  houseNo: string;
  place: string;
  typeLabel: string;
  roomsLabel: string;
  bathsLabel: string;
  rentLabel: string;
  serviceChargeLabel: string;
  depositLabel?: string | null;
  viewingLabel: string;
  description: string;
  callHref: string;
  shareUrl: string;
  shareTitle: string;
  shareText: string;
};

type VacancyListingGridProps = {
  listings: VacancyListingCard[];
  pagination: VacancyPaginationState;
  searchParams?: Record<string, string | undefined>;
};

export function VacancyListingGrid({
  listings,
  pagination,
  searchParams = {},
}: VacancyListingGridProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        {listings.map((listing) => (
          <article
            key={listing.id}
            className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)] dark:border-white/15 dark:bg-slate-900 dark:shadow-none dark:hover:border-white/30"
          >
            <Link href={listing.href} className="block">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                {listing.hasImage && listing.imageSrc ? (
                  <Image
                    src={listing.imageSrc}
                    alt={listing.imageAlt}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      No images
                    </span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 z-10 rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md">
                  {listing.viewingLabel}
                </div>
              </div>
            </Link>

            <div className="flex flex-1 flex-col gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">
                  {listing.managerName}
                </p>
                <h2 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-slate-950 dark:text-white">
                  {listing.propertyName} · Unit {listing.houseNo}
                </h2>
              </div>

              <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{listing.place}</span>
              </div>

              <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-slate-700 dark:text-slate-200">
                {listing.description}
              </p>

              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                <span className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-2 text-center dark:border-white/10 dark:bg-slate-950">
                  <BedDouble className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                  <span className="max-w-full truncate">{listing.roomsLabel}</span>
                </span>
                <span className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-2 text-center dark:border-white/10 dark:bg-slate-950">
                  <Bath className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                  <span className="max-w-full truncate">{listing.bathsLabel}</span>
                </span>
                <span className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-2 text-center dark:border-white/10 dark:bg-slate-950">
                  <Building2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                  <span className="max-w-full truncate">{listing.typeLabel}</span>
                </span>
              </div>

              <div className="mt-auto border-t border-slate-100 pt-3 dark:border-white/10">
                <p className="text-base font-semibold tracking-tight text-slate-950 dark:text-white">
                  {listing.rentLabel}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-600 dark:text-slate-300">
                  {listing.serviceChargeLabel}
                  {listing.depositLabel ? ` · ${listing.depositLabel}` : ""}
                </p>

                <div className="mt-3 grid grid-cols-[2.5rem_1fr] gap-2">
                  <a
                    href={listing.callHref}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-white/10"
                    aria-label="Call landlord or agent"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <Link
                    href={listing.href}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    View details
                  </Link>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
                  <VacancyShareActions
                    url={listing.shareUrl}
                    title={listing.shareTitle}
                    text={listing.shareText}
                    compact
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <VacancyPaginationNav
        ariaLabel="Vacancy pagination"
        basePath="/vacancies"
        pagination={pagination}
        searchParams={searchParams}
        itemLabel="vacancies"
      />
    </div>
  );
}