"use client";

import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Building2, ChevronLeft, ChevronRight, MapPin, Phone } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

export type VacancyListingCard = {
  id: string;
  reference: string;
  href: string;
  imageSrc: string;
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
  viewingLabel: string;
  description: string;
  callHref: string;
};

type VacancyListingGridProps = {
  listings: VacancyListingCard[];
};

const desktopQuery = "(min-width: 1024px)";
const wideDesktopQuery = "(min-width: 1280px)";
const mobileQuery = "(max-width: 639px)";

function subscribeToMedia(query: string, callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);

  return () => media.removeEventListener("change", callback);
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (callback) => subscribeToMedia(query, callback),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function getPageSize(isMobile: boolean, isDesktop: boolean, isWideDesktop: boolean) {
  if (isWideDesktop) return 21;
  if (isDesktop) return 15;
  if (isMobile) return 14;
  return 12;
}

export function VacancyListingGrid({ listings }: VacancyListingGridProps) {
  const isMobile = useMediaQuery(mobileQuery);
  const isDesktop = useMediaQuery(desktopQuery);
  const isWideDesktop = useMediaQuery(wideDesktopQuery);
  const pageSize = getPageSize(isMobile, isDesktop, isWideDesktop);
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(listings.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const visibleListings = useMemo(
    () => listings.slice(start, start + pageSize),
    [listings, pageSize, start],
  );

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 xl:gap-3">
        {visibleListings.map((listing) => (
          <article
            key={listing.id}
            className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/90 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900 dark:shadow-none dark:hover:border-white/20"
          >
            <Link href={listing.href} className="block">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                {listing.hasImage ? (
                  <Image
                    src={listing.imageSrc}
                    alt={listing.imageAlt}
                    fill
                    sizes="(min-width: 1280px) 14vw, (min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col justify-between bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] p-3 dark:bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 dark:text-white">
                        {listing.propertyName}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        Property photo pending
                      </p>
                    </div>
                  </div>
                )}
                <div className="absolute left-2 top-2 max-w-[calc(100%-1rem)] rounded-full bg-slate-950/78 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
                  <span className="block truncate">{listing.reference}</span>
                </div>
                <div className="absolute bottom-2 left-2 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-semibold text-slate-900 shadow-sm backdrop-blur dark:bg-slate-950/88 dark:text-slate-100">
                  {listing.viewingLabel}
                </div>
              </div>
            </Link>

            <div className="flex flex-1 flex-col gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {listing.managerName}
                </p>
                <h2 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-slate-950 dark:text-white">
                  {listing.propertyName} · Unit {listing.houseNo}
                </h2>
              </div>

              <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                <span className="truncate">{listing.place}</span>
              </div>

              <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-slate-600 dark:text-slate-300">
                {listing.description}
              </p>

              <div className="grid grid-cols-3 gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-1.5 py-2 text-center dark:border-white/10 dark:bg-slate-950">
                  <BedDouble className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="max-w-full truncate">{listing.roomsLabel}</span>
                </span>
                <span className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-1.5 py-2 text-center dark:border-white/10 dark:bg-slate-950">
                  <Bath className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="max-w-full truncate">{listing.bathsLabel}</span>
                </span>
                <span className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-1.5 py-2 text-center dark:border-white/10 dark:bg-slate-950">
                  <Building2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="max-w-full truncate">{listing.typeLabel}</span>
                </span>
              </div>

              <div className="mt-auto border-t border-slate-100 pt-3 dark:border-white/10">
                <p className="text-base font-semibold tracking-tight text-slate-950 dark:text-white">
                  {listing.rentLabel}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {listing.serviceChargeLabel}
                </p>

                <div className="mt-3 grid grid-cols-[2.5rem_1fr] gap-2">
                  <a
                    href={listing.callHref}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-cyan-300/70 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
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
              </div>
            </div>
          </article>
        ))}
      </div>

      {pageCount > 1 ? (
        <nav
          className="flex flex-col gap-3 rounded-xl border border-white/90 bg-white/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-slate-900"
          aria-label="Vacancy pagination"
        >
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Showing {start + 1}-{Math.min(start + pageSize, listings.length)} of {listings.length}
          </p>
          <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 sm:w-auto sm:grid-cols-[2.75rem_auto_2.75rem]">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
              aria-label="Previous vacancy page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-center text-sm font-semibold text-slate-700 dark:text-slate-200 sm:min-w-28">
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pageCount}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
              aria-label="Next vacancy page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
