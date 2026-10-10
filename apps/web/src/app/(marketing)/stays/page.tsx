import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, UsersRound as Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { publicBnbWhere, bnbImages } from "@/features/bnb/queries";
import { bnbPhotoUrl, bnbMoney } from "@/features/bnb/validation";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "BnB & short stays", description: "Discover furnished BnBs and short stays. Browse photos, compare nightly rates, and contact hosts directly on EstateDesk.", alternates: { canonical: "/stays" } };
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
  const listings = await prisma.bnbListing.findMany({ where, include: { images: { ...bnbImages, take: 1 }, org: { select: { currencyCode: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 12, take: 12 });
  const pageUrl = (next: number) => `/stays?${new URLSearchParams({ q, ...(guests ? { guests: String(guests) } : {}), ...(maxPrice ? { maxPrice: String(maxPrice) } : {}), page: String(next) })}`;
  return <><PublicAccessHeader active="stays" /><main id="main-content" className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
    <header className="max-w-3xl space-y-4"><p className="text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">A place to unwind</p><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Find your next stay</h1><p className="text-lg text-muted-foreground">From a cozy city studio to a weekend hideaway. Explore BnBs, compare nightly rates, and enquire directly with the host.</p></header>
    <form className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
      <label className="space-y-2 text-sm font-medium" htmlFor="stay-q"><span>Where would you like to stay?</span><Input id="stay-q" name="q" defaultValue={q} placeholder="Location or listing title" /></label>
      <label className="space-y-2 text-sm font-medium" htmlFor="stay-guests"><span>Guests</span><Input id="stay-guests" name="guests" type="number" min={1} max={100} defaultValue={guests} placeholder="Any" /></label>
      <label className="space-y-2 text-sm font-medium" htmlFor="stay-price"><span>Max nightly rate (KES)</span><Input id="stay-price" name="maxPrice" type="number" min={1} max={9999999999.99} step="0.01" defaultValue={maxPrice} placeholder="Any budget" /></label>
      <Button type="submit" className="self-end">Search stays</Button>
    </form>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{total} {total === 1 ? "stay" : "stays"} {q ? `matching “${q}”` : "to discover"}</p>{(q || guests || maxPrice) && <Link href="/stays" className="text-sm font-medium underline">Clear filters</Link>}</div>
    {listings.length === 0 ? <section className="rounded-2xl border border-dashed p-10 text-center space-y-3"><h2 className="text-xl font-semibold">{q || guests || maxPrice ? "No stays match your search" : "New stays are on the way"}</h2><p className="text-muted-foreground">{q || guests || maxPrice ? "Try another location, guest count, or budget." : "Check back soon for BnBs published by our hosts."}</p></section> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{listings.map((listing) => <article key={listing.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg"><Link href={`/stays/${listing.slug}`} className="block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500"><div className="relative aspect-[4/3] bg-muted"><Image src={bnbPhotoUrl(listing.images[0])} alt={listing.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /><span className="absolute left-3 top-3 rounded-full bg-background/95 px-3 py-1 text-xs font-semibold">{listing.propertyType.toLowerCase().replaceAll("_", " ")}</span></div><div className="space-y-3 p-5"><h2 className="text-xl font-semibold">{listing.title}</h2><p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{listing.location}</p><p className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />{listing.maxGuests} guests · {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bedrooms`} · {listing.beds} beds</p><p className="text-lg font-bold">{bnbMoney(Number(listing.nightlyRate), listing.org.currencyCode)}<span className="text-sm font-normal text-muted-foreground"> / night</span></p><p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">View stay →</p></div></Link></article>)}</div>}
    {total > 12 && <nav aria-label="Stay pages" className="flex items-center justify-between gap-3">{page > 1 ? <Button asChild variant="outline"><Link href={pageUrl(page - 1)}>Previous</Link></Button> : <span />}<span className="text-sm">Page {page} of {Math.ceil(total / 12)}</span>{page * 12 < total ? <Button asChild variant="outline"><Link href={pageUrl(page + 1)}>Next</Link></Button> : <span />}</nav>}
  </main><PublicAccessFooter /></>;
}
