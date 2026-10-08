import { notFound } from "next/navigation";
import { requireOrgRole } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { WorkspaceHero } from "@/components/shared/workspace-hero";
import { bnbImages } from "@/features/bnb/queries";
import { bnbPhotoUrl, type BnbFormValues } from "@/features/bnb/validation";
import { BnbForm } from "@/features/bnb/components/bnb-form";
export default async function EditBnbPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  const { id } = await params;
  const listing = await prisma.bnbListing.findFirst({ where: { id, orgId: session.activeOrgId!, deletedAt: null }, include: { images: bnbImages, org: { select: { currencyCode: true } } } });
  if (!listing) notFound();
  const initial = { ...listing, propertyType: listing.propertyType as BnbFormValues["propertyType"], amenities: listing.amenities as BnbFormValues["amenities"], nightlyRate: Number(listing.nightlyRate), cleaningFee: Number(listing.cleaningFee), images: listing.images.map((image) => ({ id: image.id, url: bnbPhotoUrl(image) })) };
  return <main id="main-content" className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8"><WorkspaceHero kind="org" eyebrow="Airbnb" title="Edit BnB listing" description="Keep your photos, rates, and guest information up to date." /><BnbForm listing={initial} contactName={session.fullName} currency={listing.org.currencyCode} /></main>;
}
