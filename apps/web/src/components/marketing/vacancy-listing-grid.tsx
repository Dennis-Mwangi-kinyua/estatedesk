import Image from "next/image";
import Link from "@/components/navigation/workspace-link";
import { Bath, MapPin } from "lucide-react";
import { BedDouble, Building2, Phone } from "@/components/shared/colored-icons";
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
  initialCostLabel?: string;
  updatedLabel?: string;
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
    <div className="space-y-8">
      <div className="vacancy-listing-grid grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <article key={listing.id} className="vacancy-listing-card group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
            <Link href={listing.href} aria-label={`View ${listing.propertyName}, unit ${listing.houseNo}`} className="relative block aspect-[16/10] overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary">
              {listing.hasImage && listing.imageSrc ? <Image src={listing.imageSrc} alt={listing.imageAlt} fill sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]" /> : <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground"><Building2 className="h-10 w-10" aria-hidden="true" /><span className="text-sm">Photos not provided</span></div>}
              <span className="absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-lg border border-white/20 bg-slate-950/85 px-3 py-1.5 text-xs font-medium text-white">{listing.typeLabel}</span>
            </Link>
            <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><p className="text-2xl font-semibold tracking-tight">{listing.rentLabel}</p><span className="text-sm text-muted-foreground">/ month</span></div>
              <div>
                <h2 className="break-words text-lg font-semibold leading-6"><Link href={listing.href} className="rounded focus-visible:outline-2 focus-visible:outline-primary hover:underline">{listing.propertyName}</Link></h2>
                <p className="mt-1 text-sm text-muted-foreground">Unit {listing.houseNo}</p>
                <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span className="break-words">{listing.place}</span></p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 border-y border-border py-3 text-sm"><span className="inline-flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{listing.roomsLabel}</span><span className="inline-flex items-center gap-1.5"><Bath className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{listing.bathsLabel}</span></div>
              <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{listing.description}</p>
              <details className="rounded-xl border border-border px-3"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">Fees & viewing details</summary><dl className="space-y-2 pb-3 text-sm text-muted-foreground"><div><dt className="sr-only">Service charge</dt><dd>{listing.serviceChargeLabel}</dd></div>{listing.depositLabel ? <div><dt className="sr-only">Deposit</dt><dd>{listing.depositLabel}</dd></div> : null}<div><dt className="sr-only">Viewing</dt><dd>{listing.viewingLabel}</dd></div></dl></details>
              <div className="mt-auto space-y-4 pt-1">
                {listing.initialCostLabel ? <p className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">{listing.initialCostLabel}<span className="mt-1 block text-xs font-normal text-muted-foreground">Confirm all fees before paying.</span></p> : null}
                {listing.updatedLabel ? <p className="text-xs text-muted-foreground">{listing.updatedLabel}</p> : null}
                <p className="text-xs leading-5 text-muted-foreground">Listed by <span className="font-medium text-foreground">{listing.managerName}</span></p>
                <div className="grid grid-cols-[1fr_auto] gap-2"><Link data-workspace-action="true" href={listing.href} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">View property</Link><a data-workspace-action="true" href={listing.callHref} aria-label={`Contact the manager about ${listing.propertyName}, unit ${listing.houseNo}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold"><Phone className="h-4 w-4" aria-hidden="true" /><span>Contact</span></a></div>
                <details className="border-t border-border pt-1"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-muted-foreground">Share this property</summary><div className="pb-1"><VacancyShareActions url={listing.shareUrl} title={listing.shareTitle} text={listing.shareText} compact /></div></details>
              </div>
            </div>
          </article>
        ))}
      </div>
      <VacancyPaginationNav ariaLabel="Vacancy pagination" basePath="/vacancies" pagination={pagination} searchParams={searchParams} itemLabel="vacancies" />
    </div>
  );
}
