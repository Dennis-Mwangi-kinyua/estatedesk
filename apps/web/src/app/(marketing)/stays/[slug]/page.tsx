import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { BedDouble, Bath, UsersRound as Users, MapPin, Check, Phone, Mail } from "lucide-react";
import { getPublicBnb } from "@/features/bnb/queries";
import { bnbPhotoUrl, bnbMoney } from "@/features/bnb/validation";
import { StayGallery } from "@/features/bnb/components/stay-gallery";
import { PublicAccessHeader } from "@/components/marketing/public-access-header";
import { PublicAccessFooter } from "@/components/marketing/public-access-footer";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
const load = cache(getPublicBnb);
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await load(slug);
  if (!listing) return { title: "Stay not found", robots: { index: false, follow: false } };
  return { title: listing.title, description: listing.description.slice(0, 160), alternates: { canonical: `/stays/${listing.slug}` }, openGraph: { title: listing.title, description: listing.description.slice(0, 160), url: `/stays/${listing.slug}`, images: listing.images.slice(0, 1).map((image) => ({ url: bnbPhotoUrl(image), alt: listing.title })) } };
}
export default async function StayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await load(slug);
  if (!listing) notFound();
  const currency = listing.org.currencyCode;
  return <><PublicAccessHeader active="stays" /><main id="main-content" className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
    <Link href="/stays" className="inline-flex min-h-11 items-center text-sm font-medium underline">← All stays</Link>
    <header className="space-y-3"><p className="text-sm font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">{listing.propertyType.toLowerCase().replaceAll("_", " ")} · BnB stay</p><h1 className="text-3xl font-bold sm:text-4xl">{listing.title}</h1><p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{listing.location}</p></header>
    <div className="grid items-start gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-7"><StayGallery title={listing.title} images={listing.images.map((image) => ({ id: image.id, url: bnbPhotoUrl(image) }))} />
        <div className="flex flex-wrap gap-5 rounded-2xl border bg-card p-5 text-sm"><span className="flex items-center gap-2"><Users className="h-5 w-5" />{listing.maxGuests} guests</span><span className="flex items-center gap-2"><BedDouble className="h-5 w-5" />{listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bedrooms`} · {listing.beds} beds</span><span className="flex items-center gap-2"><Bath className="h-5 w-5" />{listing.bathrooms} bathrooms</span></div>
        <section className="space-y-3"><h2 className="text-2xl font-semibold">About this stay</h2><p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{listing.description}</p></section>
        {listing.amenities.length > 0 && <section className="space-y-4"><h2 className="text-2xl font-semibold">What this place offers</h2><ul className="grid gap-3 sm:grid-cols-2">{listing.amenities.map((amenity) => <li key={amenity} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" />{amenity}</li>)}</ul></section>}
        {listing.houseRules && <section className="space-y-3"><h2 className="text-2xl font-semibold">House rules</h2><p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{listing.houseRules}</p></section>}
        {listing.address && <section className="space-y-3"><h2 className="text-2xl font-semibold">Location & directions</h2><p className="whitespace-pre-wrap text-muted-foreground">{listing.address}</p></section>}
      </div>
      <aside className="space-y-5 rounded-2xl border bg-card p-6 shadow-lg lg:sticky lg:top-24">
        <p className="text-3xl font-bold">{bnbMoney(Number(listing.nightlyRate), currency)}<span className="text-base font-normal text-muted-foreground"> / night</span></p>
        <dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt>Cleaning fee per stay</dt><dd>{bnbMoney(Number(listing.cleaningFee), currency)}</dd></div><div className="flex justify-between gap-3"><dt>Minimum stay</dt><dd>{listing.minimumNights} {listing.minimumNights === 1 ? "night" : "nights"}</dd></div></dl>
        <div className="border-t pt-5 space-y-2"><h2 className="text-lg font-semibold">Enquire with the host</h2><p className="font-medium">{listing.contactName}</p><p className="text-sm text-muted-foreground">Managed by {listing.org.name}</p></div>
        <Button asChild className="w-full"><a href={`tel:${listing.contactPhone.replace(/[\s()-]/g, "")}`}><Phone className="h-4 w-4" />Call host</a></Button>
        <p className="text-center text-sm">{listing.contactPhone}</p>
        {listing.contactEmail && <Button asChild variant="outline" className="w-full"><a href={`mailto:${listing.contactEmail}?subject=${encodeURIComponent(`Enquiry: ${listing.title}`)}`}><Mail className="h-4 w-4" />Email host</a></Button>}
        <p className="text-sm leading-relaxed text-muted-foreground">Contact the host to confirm dates, availability, and the total cost of your stay.</p>
      </aside>
    </div>
  </main><PublicAccessFooter /></>;
}
