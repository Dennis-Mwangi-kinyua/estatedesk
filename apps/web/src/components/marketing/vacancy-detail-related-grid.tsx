import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VacancyPaginationNav } from "@/components/marketing/vacancy-pagination-nav";
import type { VacancyPaginationState } from "@/lib/vacancy-pagination";

export type RelatedVacancyListingCard = {
  id: string;
  href: string;
  imageSrc: string | null;
  hasImage: boolean;
  imageAlt: string;
  propertyName: string;
  houseNo: string;
  place: string;
  rentLabel: string;
  roomsLabel: string;
};

type VacancyDetailRelatedGridProps = {
  listings: RelatedVacancyListingCard[];
  pagination: VacancyPaginationState;
  basePath: string;
};

function RelatedVacancyCard({ listing }: { listing: RelatedVacancyListingCard }) {
  return (
    <Link
      href={listing.href}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {listing.hasImage && listing.imageSrc ? (
          <Image
            src={listing.imageSrc}
            alt={listing.imageAlt}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 80vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              No images
            </span>
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 dark:text-white">
          {listing.propertyName} · Unit {listing.houseNo}
        </h3>
        <p className="truncate text-xs text-slate-600 dark:text-slate-300">{listing.place}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-950 dark:text-white">{listing.rentLabel}</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {listing.roomsLabel}
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function VacancyDetailRelatedGrid({
  listings,
  pagination,
  basePath,
}: VacancyDetailRelatedGridProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {listings.map((listing) => (
          <RelatedVacancyCard key={listing.id} listing={listing} />
        ))}
      </div>

      <VacancyPaginationNav
        ariaLabel="More vacant units pagination"
        basePath={basePath}
        pagination={pagination}
        pageParam="relatedPage"
        itemLabel="units"
      />
    </div>
  );
}