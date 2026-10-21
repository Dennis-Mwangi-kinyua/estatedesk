import "server-only";
import { prisma } from "@/lib/prisma";
import type { RecordScope } from "@/lib/permissions/record-scope";
import { bnbListingScopeWhere } from "./scope";
import { z } from "zod";
export const reservationSchema = z.object({
  guestName: z.string().trim().min(2).max(120),
  guestPhone: z.string().trim().max(25).regex(/^[+\d ()-]*$/),
  checkIn: z.iso.datetime({ offset: true }),
  checkOut: z.iso.datetime({ offset: true }),
}).refine(v => Date.parse(v.checkOut) > Date.parse(v.checkIn) && Date.parse(v.checkOut)-Date.parse(v.checkIn) <= 365 * 86400000, "Checkout must be after check-in, within one year.");
export async function saveReservation(orgId: string, listingId: string, input: unknown, reservationId?: string, scope?: RecordScope) {
  const parsed = reservationSchema.parse(input);
  const checkIn = new Date(parsed.checkIn), checkOut = new Date(parsed.checkOut);
  if (checkOut <= new Date()) throw new Error("Checkout must be in the future.");
  return prisma.$transaction(async tx => {
    // Serialize writers for this listing, including simultaneous extensions and new bookings.
    await tx.$queryRaw`SELECT "id" FROM "BnbListing" WHERE "id" = ${listingId} AND "orgId" = ${orgId} FOR UPDATE`;
    const listing = await tx.bnbListing.findFirst({ where: { AND: [await bnbListingScopeWhere(orgId, scope, tx), { id: listingId }] } });
    if (!listing) throw new Error("Listing not found.");
    if (listing.availableFrom && checkIn < listing.availableFrom) throw new Error("This stay starts before the host's availability date.");
    if (+checkOut - +checkIn < listing.minimumNights * 86400000) throw new Error(`Book at least ${listing.minimumNights} night(s).`);
    const existing = reservationId ? await tx.bnbReservation.findFirst({ where: { id: reservationId, listingId, cancelledAt: null, checkedOutAt: null } }) : null;
    if (reservationId && !existing) throw new Error("This booking is no longer active.");
    if (existing?.checkedInAt && +existing.checkIn !== +checkIn) throw new Error("Check-in cannot change after the guest has entered.");
    const overlap = await tx.bnbReservation.findFirst({ where: { listingId, id: { not: reservationId ?? "" }, cancelledAt: null, checkedOutAt: null, checkIn: { lt: checkOut }, checkOut: { gt: checkIn } } });
    if (overlap) throw new Error("These dates overlap another booking. Choose another checkout or stay.");
    const data = { guestName: parsed.guestName, guestPhone: parsed.guestPhone || null, checkIn, checkOut };
    return existing ? tx.bnbReservation.update({ where: { id: existing.id }, data }) : tx.bnbReservation.create({ data: { ...data, listingId } });
  });
}
