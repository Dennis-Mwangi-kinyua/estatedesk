import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronRight,
  Coins,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  VacancyDetailRelatedGrid,
  type RelatedVacancyListingCard,
} from "@/components/marketing/vacancy-detail-related-grid";
import type { VacancyPaginationState } from "@/lib/vacancy-pagination";
import { VacancyShareActions } from "@/components/marketing/vacancy-share-actions";

type GalleryImage = {
  key: string;
  fileName: string | null;
};

type VacancyHighlight = {
  label: string;
  value: string;
  icon: ReactNode;
};

type VacancyDetailGalleryProps = {
  gallery: GalleryImage[];
  title: string;
  rentLabel: string;
  viewingLabel: string;
  imageUrl: (key: string | null | undefined) => string | null;
  hasPhotos: boolean;
};

type VacancyDetailOverviewProps = {
  managerName: string;
  propertyName: string;
  houseNo: string;
  place: string;
  description: string;
};

type VacancyDetailHighlightsProps = {
  highlights: VacancyHighlight[];
};

type VacancyDetailDescriptionProps = {
  address?: string | null;
  propertyNotes?: string | null;
  unitNotes?: string | null;
};

type VacancyInquiryFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  defaultMessage: string;
  sent?: string;
  error?: string;
};

type VacancyDetailSidebarProps = {
  rentLabel: string;
  serviceChargeLabel: string;
  viewingLabel: string;
  managerName: string;
  callHref: string;
  shareUrl: string;
  shareTitle: string;
  shareText: string;
  inquiry: VacancyInquiryFormProps;
};

type VacancyDetailRelatedProps = {
  listings: RelatedVacancyListingCard[];
  pagination: VacancyPaginationState;
  basePath: string;
};

export function VacancyDetailBreadcrumb({
  place,
  houseNo,
  locationHref,
}: {
  place: string;
  houseNo: string;
  locationHref: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900/70"
    >
      <ol className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-1.5 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 sm:px-6 lg:px-8">
        <li>
          <Link href="/vacancies" className="font-semibold transition hover:text-slate-950 dark:hover:text-white">
            Vacancies
          </Link>
        </li>
        <li aria-hidden="true" className="text-slate-400">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li>
          <Link href={locationHref} className="font-medium transition hover:text-slate-950 dark:hover:text-white">
            {place}
          </Link>
        </li>
        <li aria-hidden="true" className="text-slate-400">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li className="font-semibold text-slate-950 dark:text-white">Unit {houseNo}</li>
      </ol>
    </nav>
  );
}

export function VacancyDetailGallery({
  gallery,
  title,
  rentLabel,
  viewingLabel,
  imageUrl,
  hasPhotos,
}: VacancyDetailGalleryProps) {
  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_24px_60px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-slate-800">
        {hasPhotos && gallery[0]?.key && imageUrl(gallery[0].key) ? (
          <Image
            src={imageUrl(gallery[0].key)!}
            alt={gallery[0]?.fileName ?? title}
            fill
            priority
            sizes="(min-width: 1024px) 62vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
            <span className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              No images
            </span>
          </div>
        )}
        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-[0_4px_14px_rgba(5,150,105,0.45)]">
            Vacant now
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-md">
            {viewingLabel}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 z-10 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.28)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Monthly rent</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-950">{rentLabel}</p>
        </div>
      </div>

      {gallery.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {gallery.slice(1, 5).map((asset) => (
            <div
              key={asset.key}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-800"
            >
              <Image
                src={imageUrl(asset.key)!}
                alt={asset.fileName ?? title}
                fill
                sizes="20vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function VacancyDetailOverview({
  managerName,
  propertyName,
  houseNo,
  place,
  description,
}: VacancyDetailOverviewProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
      <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900 dark:border-cyan-200/40 dark:bg-cyan-200/10 dark:text-cyan-50">
        <ShieldCheck className="h-3.5 w-3.5" />
        Listed by {managerName}
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
        {propertyName}
        <span className="block text-xl font-medium text-slate-600 dark:text-slate-300 sm:text-2xl">
          Unit {houseNo}
        </span>
      </h1>
      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
        <span>{place}</span>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
    </section>
  );
}

export function VacancyDetailHighlights({ highlights }: VacancyDetailHighlightsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {highlights.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            {item.icon}
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{item.label}</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{item.value}</p>
        </div>
      ))}
    </section>
  );
}

export function VacancyDetailDescription({
  address,
  propertyNotes,
  unitNotes,
}: VacancyDetailDescriptionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Building2 className="h-4 w-4" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">About this unit</h2>
      </div>
      {address ? (
        <p className="mt-4 text-base font-semibold text-slate-950 dark:text-white">{address}</p>
      ) : null}
      {propertyNotes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{propertyNotes}</p>
      ) : null}
      {unitNotes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">{unitNotes}</p>
      ) : null}
    </section>
  );
}

function VacancyInquiryForm({ action, defaultMessage, sent, error }: VacancyInquiryFormProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Request a viewing</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Send your details and the managing office will follow up directly.
      </p>

      {sent ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Enquiry sent successfully. Expect a call or message soon.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </div>
      ) : null}

      <form action={action} className="mt-5 space-y-4" data-conversion-event="vacancy_inquiry_submit">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Full name
          </span>
          <input
            name="fullName"
            required
            placeholder="Jane Kamau"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Phone number
          </span>
          <input
            name="phone"
            required
            placeholder="07xx xxx xxx"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Email address
          </span>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Message
          </span>
          <textarea
            name="message"
            required
            rows={4}
            defaultValue={defaultMessage}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <Send className="h-4 w-4" />
          Send enquiry
        </button>
      </form>
    </section>
  );
}

export function VacancyDetailSidebar({
  rentLabel,
  serviceChargeLabel,
  viewingLabel,
  managerName,
  callHref,
  shareUrl,
  shareTitle,
  shareText,
  inquiry,
}: VacancyDetailSidebarProps) {
  return (
    <aside id="enquire" className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Monthly rent
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{rentLabel}</p>
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-600 dark:text-slate-300">Service charge</span>
            <span className="font-semibold text-slate-950 dark:text-white">{serviceChargeLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-600 dark:text-slate-300">Viewing</span>
            <span className="font-semibold text-slate-950 dark:text-white">{viewingLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-600 dark:text-slate-300">Manager</span>
            <span className="truncate font-semibold text-slate-950 dark:text-white">{managerName}</span>
          </div>
        </div>
        <a
          href={callHref}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
        >
          <Phone className="h-4 w-4" />
          Call landlord or agent
        </a>
      </section>

      <VacancyInquiryForm {...inquiry} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <VacancyShareActions url={shareUrl} title={shareTitle} text={shareText} compact />
      </section>
    </aside>
  );
}

export function VacancyDetailRelated({ listings, pagination, basePath }: VacancyDetailRelatedProps) {
  if (listings.length === 0) return null;

  return (
    <section
      id="more-vacant-units"
      className="border-t border-slate-200 bg-white/70 py-8 dark:border-white/10 dark:bg-slate-900/40 sm:py-10"
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white sm:text-2xl">
              More vacant units
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Other available homes you may want to compare before booking a viewing.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {listings.length} related {listings.length === 1 ? "unit" : "units"} available
            </p>
          </div>
          <Link
            href="/vacancies"
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-white/25 dark:hover:bg-slate-800"
          >
            Browse all vacancies
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <VacancyDetailRelatedGrid listings={listings} pagination={pagination} basePath={basePath} />
      </div>
    </section>
  );
}

export function vacancyDetailHighlightIcons() {
  return {
    rent: <Coins className="h-4 w-4" />,
    rooms: <BedDouble className="h-4 w-4" />,
    baths: <Bath className="h-4 w-4" />,
    type: <Building2 className="h-4 w-4" />,
    location: <MapPin className="h-4 w-4" />,
    viewing: <ShieldCheck className="h-4 w-4" />,
  };
}