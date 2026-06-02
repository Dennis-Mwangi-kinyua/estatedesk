"use client";

import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Building2, ChevronLeft, ChevronRight, MapPin, Phone } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { VacancyShareActions } from "@/components/marketing/vacancy-share-actions";

export type VacancyListingCard = {
  id: string;
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
  shareUrl: string;
  shareTitle: string;
  shareText: string;
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 xl:gap-3">
        {visibleListings.map((listing) => (
          <article
            key={listing.id}
            className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_48px_rgba(15,23,42,0.12)] dark:border-white/15 dark:bg-slate-900 dark:shadow-none dark:hover:border-white/30"
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
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] p-3 dark:bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)]">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-white/10 dark:bg-[#0b0f16] dark:text-[#f8fafc]">
                        <Building2 className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-[#e5e7eb]">
                        Photo pending
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-900 shadow-sm backdrop-blur dark:bg-[#0b0f16] dark:text-[#f8fafc]">
                  {listing.viewingLabel}
                </div>
              </div>
            </Link>

            <div className="flex flex-1 flex-col gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-[#d1d5db]">
                  {listing.managerName}
                </p>
                <h2 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-slate-950 dark:text-white">
                  {listing.propertyName} · Unit {listing.houseNo}
                </h2>
              </div>

              <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-[#e5e7eb]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-[#9ca3af]" />
                <span className="truncate">{listing.place}</span>
              </div>

              <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-slate-700 dark:text-[#e5e7eb]">
                {listing.description}
              </p>

              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-medium text-slate-700 dark:text-[#e5e7eb]">
                <span className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-2 text-center dark:border-white/10 dark:bg-[#0b0f16]">
                  <BedDouble className="h-3.5 w-3.5 text-slate-600 dark:text-[#d1d5db]" />
                  <span className="max-w-full truncate">{listing.roomsLabel}</span>
                </span>
                <span className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-2 text-center dark:border-white/10 dark:bg-[#0b0f16]">
                  <Bath className="h-3.5 w-3.5 text-slate-600 dark:text-[#d1d5db]" />
                  <span className="max-w-full truncate">{listing.bathsLabel}</span>
                </span>
                <span className="inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-2 text-center dark:border-white/10 dark:bg-[#0b0f16]">
                  <Building2 className="h-3.5 w-3.5 text-slate-600 dark:text-[#d1d5db]" />
                  <span className="max-w-full truncate">{listing.typeLabel}</span>
                </span>
              </div>

              <div className="mt-auto border-t border-slate-100 pt-3 dark:border-white/10">
                <p className="text-base font-semibold tracking-tight text-slate-950 dark:text-white">
                  {listing.rentLabel}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-600 dark:text-[#d1d5db]">
                  {listing.serviceChargeLabel}
                </p>

                <div className="mt-3 grid grid-cols-[2.5rem_1fr] gap-2">
                  <a
                    href={listing.callHref}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/15 dark:bg-[#0b0f16] dark:text-[#f8fafc] dark:hover:bg-white/[0.10]"
                    aria-label="Call landlord or agent"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <Link
                    href={listing.href}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:bg-white dark:text-[#0b0f16] dark:hover:bg-[#e5e7eb] dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#0b0f16]"
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

      {pageCount > 1 ? (
        <nav
          className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_42px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-slate-900 dark:shadow-none sm:p-4"
          aria-label="Vacancy pagination"
        >
          <div className="mb-3 flex flex-col items-center justify-center gap-1 border-b border-slate-100 pb-3 text-center dark:border-white/10 sm:flex-row sm:justify-between sm:text-left">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Page {currentPage} of {pageCount}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-[#9ca3af]">
              Showing {start + 1}-{Math.min(start + pageSize, listings.length)} of {listings.length} vacancies
            </p>
          </div>
          <div className="grid w-full grid-cols-2 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 dark:border-white/20 dark:bg-[#0f172a] dark:text-[#f8fafc] dark:hover:border-cyan-200 dark:hover:bg-cyan-200/15 dark:hover:text-cyan-100 dark:disabled:bg-[#0f172a] dark:disabled:text-[#6b7280]"
              aria-label="Previous vacancy page"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="hidden h-11 min-w-28 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 shadow-sm dark:border-white/15 dark:bg-[#0b0f16] dark:text-[#f8fafc] sm:inline-flex">
              {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pageCount}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-white dark:text-[#0b0f16] dark:hover:bg-[#e5e7eb] dark:disabled:bg-[#374151] dark:disabled:text-[#9ca3af]"
              aria-label="Next vacancy page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
