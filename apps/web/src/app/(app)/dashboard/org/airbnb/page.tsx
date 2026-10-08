import Image from "next/image";
import Link from "next/link";
import { BedDouble, MapPin, Plus, Users } from "lucide-react";
import { requireOrgRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { WorkspaceHero } from "@/components/shared/workspace-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bnbImages } from "@/features/bnb/queries";
import { bnbMoney, bnbPhotoUrl } from "@/features/bnb/validation";
import { ListingControls } from "@/features/bnb/components/listing-controls";

export default async function AirbnbPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; saved?: string; page?: string }> }) {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 160) : "";
  const status = ["DRAFT", "PUBLISHED", "PAUSED"].includes(params.status ?? "") ? params.status as "DRAFT" | "PUBLISHED" | "PAUSED" : undefined;
  const requestedPage = Math.max(1, Math.min(10000, Math.floor(Number(params.page)) || 1));
  const where = { orgId: session.activeOrgId!, deletedAt: null, ...(status ? { status } : {}), ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { location: { contains: q, mode: "insensitive" as const } }] } : {}) };
  const total = await prisma.bnbListing.count({ where });
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / 12)));
  const [listings, org] = await Promise.all([
    prisma.bnbListing.findMany({ where, include: { images: { ...bnbImages, take: 1 } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 12, take: 12 }),
    prisma.organization.findUniqueOrThrow({ where: { id: session.activeOrgId! }, select: { currencyCode: true } }),
  ]);
  const pageUrl = (next: number) => `/dashboard/org/airbnb?${new URLSearchParams({ q, ...(status ? { status } : {}), page: String(next) })}`;
  return <main id="main-content" className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <WorkspaceHero kind="org" eyebrow="Short stays" title="Airbnb" description="Post beautiful BnB stays, manage nightly rates, and share your listings with guests." actions={<div className="flex flex-wrap gap-2"><Button asChild><Link href="/dashboard/org/airbnb/new"><Plus className="h-4 w-4" />Post a BnB</Link></Button><Button asChild variant="outline"><Link href="/stays">Browse public stays</Link></Button></div>} />
    {params.saved === "1" && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">Your listing has been saved.</p>}
    <form className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row">
      <label className="flex-1 space-y-1 text-sm" htmlFor="q"><span>Search stays</span><Input id="q" name="q" defaultValue={q} placeholder="Title or location" /></label>
      <label className="space-y-1 text-sm" htmlFor="filter-status"><span>Status</span><select id="filter-status" name="status" defaultValue={status ?? ""} className="block h-12 w-full rounded-xl border border-input bg-background px-3 sm:w-44 md:h-10"><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="PAUSED">Paused</option></select></label>
      <Button type="submit" className="self-end">Filter listings</Button>
    </form>
    <p className="text-sm text-muted-foreground">{total} {total === 1 ? "listing" : "listings"}</p>
    {listings.length === 0 ? <section className="rounded-2xl border border-dashed bg-card p-10 text-center space-y-4"><BedDouble className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="text-xl font-semibold">{q || status ? "No matching stays" : "Your first BnB starts here"}</h2><p className="text-muted-foreground">{q || status ? "Try another search or status." : "Add photos, a nightly rate, and the details that make your space special."}</p><Button asChild><Link href={q || status ? "/dashboard/org/airbnb" : "/dashboard/org/airbnb/new"}>{q || status ? "Clear filters" : "Post a BnB"}</Link></Button></section> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{listings.map((listing) => <article key={listing.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="relative aspect-[4/3] bg-muted">{listing.images[0] ? <Image src={bnbPhotoUrl(listing.images[0])} alt={listing.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" /> : <div className="flex h-full items-center justify-center"><BedDouble className="h-12 w-12 text-muted-foreground" /></div>}<span className="absolute left-3 top-3 rounded-full bg-background/95 px-3 py-1 text-xs font-semibold">{listing.status.toLowerCase()}</span></div>
      <div className="space-y-4 p-5"><h2 className="text-lg font-semibold">{listing.title}</h2><p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{listing.location}</p><p className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" />{listing.maxGuests} guests · {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bedrooms`} · {listing.beds} beds</p><p className="text-lg font-bold">{bnbMoney(Number(listing.nightlyRate), org.currencyCode)}<span className="text-sm font-normal text-muted-foreground"> / night</span></p>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href={`/dashboard/org/airbnb/${listing.id}/edit`}>Edit listing</Link></Button>{listing.status === "PUBLISHED" && <Button asChild variant="ghost"><Link href={`/stays/${listing.slug}`}>View public listing</Link></Button>}</div>
        <ListingControls id={listing.id} published={listing.status === "PUBLISHED"} />
      </div>
    </article>)}</div>}
    {total > 12 && <nav aria-label="Listing pages" className="flex items-center justify-between gap-3">{page > 1 ? <Button asChild variant="outline"><Link href={pageUrl(page - 1)}>Previous</Link></Button> : <span />}<span className="text-sm">Page {page} of {Math.ceil(total / 12)}</span>{page * 12 < total ? <Button asChild variant="outline"><Link href={pageUrl(page + 1)}>Next</Link></Button> : <span />}</nav>}
  </main>;
}
