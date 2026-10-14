import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const bnbReservationDates = { where: { cancelledAt: null, checkedOutAt: null }, select: { checkIn: true, checkOut: true, checkedInAt: true, checkedOutAt: true, cancelledAt: true }, orderBy: { checkIn: "asc" as const } };
export const bnbImages = { where: { deletedAt: null }, orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }], select: { id: true, key: true, metadata: true } };
export const publicBnbWhere: Prisma.BnbListingWhereInput = {
  status: "PUBLISHED", deletedAt: null,
  org: { status: "ACTIVE", deletedAt: null },
  images: { some: { deletedAt: null } },
};
export async function getPublicBnb(slug: string) {
  return prisma.bnbListing.findFirst({
    where: { ...publicBnbWhere, slug },
    include: { reservations: bnbReservationDates, images: bnbImages, org: { select: { name: true, currencyCode: true } } },
  });
}
