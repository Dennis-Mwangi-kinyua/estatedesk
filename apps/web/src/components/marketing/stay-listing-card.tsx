import Image from "next/image";
import Link from "next/link";
import { MapPin, BedDouble, Users, ArrowUpRight } from "lucide-react";

export type StayListingCardData = {
  href: string; title: string; location: string; photo: string; type: string;
  guests: number; bedrooms: number; beds: number; price: string; cleaningFee: string;
  minimumNights: number; availability: string;
};

export function StayListingCard({ stay }: { stay: StayListingCardData }) {
  return <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
    <Link href={stay.href} aria-label={`View ${stay.title}`} className="relative block aspect-[4/3] overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary">
      <Image src={stay.photo} alt={stay.title} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]" />
      <span className="absolute left-3 top-3 rounded-lg bg-background/95 px-3 py-1.5 text-xs font-semibold shadow-sm">{stay.type}</span>
    </Link>
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
      <div className="space-y-2"><p className="flex items-baseline gap-1.5"><span className="text-2xl font-semibold tracking-tight">{stay.price}</span><span className="text-sm text-muted-foreground">/ night</span></p><h2 className="line-clamp-2 text-lg font-semibold leading-6"><Link href={stay.href} className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-primary">{stay.title}</Link></h2><p className="flex items-start gap-1.5 text-sm text-muted-foreground"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-words">{stay.location}</span></p></div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-y border-border py-3 text-sm"><span className="inline-flex items-center gap-1.5"><Users aria-hidden="true" className="h-4 w-4 text-muted-foreground" />{stay.guests} guests</span><span className="inline-flex items-center gap-1.5"><BedDouble aria-hidden="true" className="h-4 w-4 text-muted-foreground" />{stay.bedrooms === 0 ? "Studio" : `${stay.bedrooms} bedrooms`} · {stay.beds} beds</span></div>
      <p className="text-sm leading-6 text-muted-foreground">{stay.cleaningFee} cleaning per stay · {stay.minimumNights}-night minimum</p>
      <div className="mt-auto space-y-3"><p className="rounded-xl bg-muted px-3 py-2 text-xs font-medium leading-5">{stay.availability}</p><Link href={stay.href} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Explore stay<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></div>
    </div>
  </article>;
}
