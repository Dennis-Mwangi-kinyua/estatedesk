import { stayAvailability } from "@/features/bnb/availability";
import type { Metadata } from "next";
import { publicPageMetadata, noIndexPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { PropertyBrowseHeading } from "@/components/marketing/property-browse-heading";
import { StayListingCard } from "@/components/marketing/stay-listing-card";
import { prisma } from "@/lib/prisma";
import { publicBnbWhere, bnbImages, bnbReservationDates } from "@/features/bnb/queries";
import { bnbPhotoUrl, bnbMoney } from "@/features/bnb/validation";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
type StaySearchParams = { q?: string; guests?: string; maxPrice?: string; page?: string };
export async function generateMetadata({ searchParams }: { searchParams: Promise<StaySearchParams> }): Promise<Metadata> {
  const params = await searchParams;
  const filtered = Boolean(params.q || params.guests || params.maxPrice);
  const page = Number(params.page);
  const paginated = Number.isSafeInteger(page) && page > 1;
  const createMetadata = filtered ? noIndexPageMetadata : publicPageMetadata;
  return createMetadata({
    title: `BnB & Short Stays in Kenya${paginated ? ` – Page ${page}` : ""}`,
    description: "Discover furnished BnBs and short stays. Browse photos, compare nightly rates, and contact hosts directly on EstateDesk.",
    path: paginated && !filtered ? `/stays?page=${page}` : "/stays",
  });
}
export default async function StaysPage({ searchParams }: { searchParams: Promise<{ q?: string; guests?: string; maxPrice?: string; page?: string }> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 160) : "";
  const guestsValue = Number(params.guests);
  const guests = Number.isInteger(guestsValue) && guestsValue >= 1 && guestsValue <= 100 ? guestsValue : undefined;
  const priceValue = Number(params.maxPrice);
  const maxPrice = Number.isFinite(priceValue) && priceValue > 0 && priceValue <= 9999999999.99 ? priceValue : undefined;
  const where = { ...publicBnbWhere, ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { location: { contains: q, mode: "insensitive" as const } }] } : {}), ...(guests ? { maxGuests: { gte: guests } } : {}), ...(maxPrice ? { nightlyRate: { lte: maxPrice }, org: { status: "ACTIVE" as const, deletedAt: null, currencyCode: "KES" } } : {}) };
  const total = await prisma.bnbListing.count({ where });
  const page = Math.min(Math.max(1, Math.floor(Number(params.page)) || 1), Math.max(1, Math.ceil(total / 12)));
  const listings = await prisma.bnbListing.findMany({ where, include: { reservations: bnbReservationDates, images: { ...bnbImages, take: 1 }, org: { select: { currencyCode: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 12, take: 12 });
  const pageUrl = (next: number) => `/stays?${new URLSearchParams({ q, ...(guests ? { guests: String(guests) } : {}), ...(maxPrice ? { maxPrice: String(maxPrice) } : {}), page: String(next) })}`;
  return <div className="min-h-dvh bg-background text-foreground"><PublicAccessHeader active="stays" /><main id="main-content" className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
    <PropertyBrowseHeading kind="stays" />
    <form action="/stays" method="get" aria-label="Search short stays" className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><label className="space-y-2 text-sm font-medium" htmlFor="stay-q"><span>Where would you like to stay?</span><Input id="stay-q" name="q" defaultValue={q} placeholder="Town, neighbourhood or stay name" className="min-h-12 text-base" /></label><Button type="submit" className="min-h-12 self-end rounded-xl px-6"><Search aria-hidden="true" className="h-4 w-4" />Find a stay</Button></div>
      <details open={Boolean(guests || maxPrice)} className="rounded-xl border border-border px-3"><summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium"><SlidersHorizontal aria-hidden="true" className="h-4 w-4" />Guests & budget</summary><div className="grid gap-4 pb-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium" htmlFor="stay-guests"><span>Number of guests</span><Input id="stay-guests" name="guests" type="number" min={1} max={100} defaultValue={guests} placeholder="Any group size" className="min-h-12 text-base" /></label><label className="space-y-2 text-sm font-medium" htmlFor="stay-price"><span>Max nightly rate (KES)</span><Input id="stay-price" name="maxPrice" type="number" min={1} max={9999999999.99} step="0.01" defaultValue={maxPrice} placeholder="Any budget" className="min-h-12 text-base" /></label></div></details>
    </form>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{q || guests || maxPrice ? "Your search results" : "Places to make yourself at home"}</h2><p className="mt-1 text-sm text-muted-foreground">{total} {total === 1 ? "stay" : "stays"}{q ? ` matching “${q}”` : " to explore"} · Contact hosts directly</p></div>{(q || guests || maxPrice) && <Link href="/stays" className="inline-flex min-h-11 items-center text-sm font-medium underline">Clear filters</Link>}</div>
    {listings.length === 0 ? <section className="space-y-3 rounded-2xl border border-dashed bg-muted/30 px-5 py-14 text-center"><h2 className="text-xl font-semibold">{q || guests || maxPrice ? "No stays match your search" : "Your next getaway is on its way"}</h2><p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">{q || guests || maxPrice ? "Try a nearby location, a different budget or fewer guests." : "Hosts are preparing their spaces. Check back for new short stays."}</p>{(q || guests || maxPrice) && <Button asChild variant="outline" className="min-h-12"><Link href="/stays">Explore all stays</Link></Button>}</section> : <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">{listings.map(listing => <StayListingCard key={listing.id} stay={{ href: `/stays/${listing.slug}`, title: listing.title, location: listing.location, photo: bnbPhotoUrl(listing.images[0]), type: listing.propertyType.toLowerCase().replaceAll("_", " "), guests: listing.maxGuests, bedrooms: listing.bedrooms, beds: listing.beds, price: bnbMoney(Number(listing.nightlyRate), listing.org.currencyCode), cleaningFee: bnbMoney(Number(listing.cleaningFee), listing.org.currencyCode), minimumNights: listing.minimumNights, availability: stayAvailability(listing.availableFrom, listing.reservations).label }} />)}</div>}
    {total > 12 && <nav aria-label="Stay pages" className="flex items-center justify-between gap-3 border-t border-border pt-6">{page > 1 ? <Button asChild variant="outline" className="min-h-12"><Link href={pageUrl(page - 1)}>Previous</Link></Button> : <span />}<span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 12)}</span>{page * 12 < total ? <Button asChild variant="outline" className="min-h-12"><Link href={pageUrl(page + 1)}>Next</Link></Button> : <span />}</nav>}
  </main><PublicAccessFooter /></div>;
}
