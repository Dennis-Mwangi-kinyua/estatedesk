"use server";
import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { writeAuditLog } from "@/lib/audit/security";
import { getSiteUrl } from "@/lib/seo";
import { saveReservation } from "./reservation-service";
import { bnbListingScopeWhere } from "./scope";
import { scopedPropertyWhere } from "@/lib/permissions/record-scope";
export type ReservationState = { error?: string; message?: string; accessCode?: string; loginUrl?: string };
async function editor() { const s = await requireOrgRole(["ADMIN", "MANAGER"]); await requireActiveSubscription(s.activeOrgId!); return s; }
function refresh(slug: string) { revalidatePath("/stays"); revalidatePath(`/stays/${slug}`); revalidatePath("/dashboard/org/airbnb"); revalidatePath(`/dashboard/org/airbnb/${slug}/bookings`); revalidatePath("/guest-stay"); }
export async function saveReservationAction(_state: ReservationState, form: FormData): Promise<ReservationState> {
  const session = await editor();
  try {
    const saved = await saveReservation(session.activeOrgId!, String(form.get("listingId")), Object.fromEntries(form), String(form.get("reservationId") || "") || undefined, session.membershipScope);
    const listing = await prisma.bnbListing.findUniqueOrThrow({ where: { id: saved.listingId }, select: { slug: true } });
    await writeAuditLog({ orgId: session.activeOrgId!, actorUserId: session.userId, action: form.get("reservationId") ? "BNB_BOOKING_UPDATED" : "BNB_BOOKING_CREATED", entityType: "BnbReservation", entityId: saved.id });
    refresh(listing.slug);
    return { message: "Booking saved. Public availability and guest access now use these dates." };
  } catch (error) { return { error: error instanceof Error && error.name !== "ZodError" ? error.message : "Check the guest details and booking dates." }; }
}
export async function changeReservationAction(_state: ReservationState, form: FormData): Promise<ReservationState> {
  const session = await editor();
  const id = String(form.get("reservationId"));
  const operation = String(form.get("operation"));
  if (!["CHECK_IN", "CHECK_OUT", "CANCEL", "ISSUE_ACCESS", "REVOKE_ACCESS"].includes(operation)) return { error: "Invalid booking action." };
  const secret = operation === "ISSUE_ACCESS" ? randomBytes(32).toString("base64url") : null;
  try {
    const saved = await prisma.$transaction(async tx => {
      const preliminary = await tx.bnbReservation.findFirst({ where: { id, listing: { AND: [await bnbListingScopeWhere(session.activeOrgId!, session.membershipScope, tx), { deletedAt: null }] } }, select: { listingId: true } });
      if (!preliminary) throw new Error("Booking not found.");
      await tx.$queryRaw`SELECT "id" FROM "BnbListing" WHERE "id" = ${preliminary.listingId} FOR UPDATE`;
      const stay = await tx.bnbReservation.findUniqueOrThrow({ where: { id }, include: { listing: { select: { slug: true } } } });
      if (stay.cancelledAt || stay.checkedOutAt) throw new Error("This booking is closed.");
      const now = new Date();
      if (operation === "CHECK_IN" && (now < stay.checkIn || now >= stay.checkOut || stay.checkedInAt)) throw new Error("Check-in is only available during the booking, once.");
      if (operation === "CHECK_OUT" && !stay.checkedInAt) throw new Error("Record check-in before checking out.");
      if (operation === "CANCEL" && stay.checkedInAt) throw new Error("Check this guest out instead of cancelling an occupied stay.");
      if (operation === "ISSUE_ACCESS" && stay.checkOut <= now) throw new Error("Extend the booking before issuing access.");
      await tx.bnbReservation.update({ where: { id }, data: operation === "CHECK_IN" ? { checkedInAt: now } : operation === "CHECK_OUT" ? { checkedOutAt: now, guestTokenHash: null } : operation === "CANCEL" ? { cancelledAt: now, guestTokenHash: null } : { guestTokenHash: secret ? createHash("sha256").update(secret).digest("hex") : null } });
      return stay;
    });
    await writeAuditLog({ orgId: session.activeOrgId!, actorUserId: session.userId, action: `BNB_${operation}`, entityType: "BnbReservation", entityId: id });
    refresh(saved.listing.slug);
    return { message: secret ? "Guest login created. Share this access code privately. Reissuing it invalidates the previous code." : "Booking updated.", ...(secret ? { accessCode: secret, loginUrl: `${getSiteUrl()}/guest-stay` } : {}) };
  } catch (error) { return { error: error instanceof Error ? error.message : "Could not update booking." }; }
}
export async function resolveGuestRequest(_state: ReservationState, form: FormData): Promise<ReservationState> {
  const session = await editor();
  const result = await prisma.bnbGuestRequest.updateMany({ where: { id: String(form.get("id")), reservation: { listing: await bnbListingScopeWhere(session.activeOrgId!, session.membershipScope) } }, data: { resolvedAt: new Date() } });
  revalidatePath("/dashboard/org/airbnb", "layout"); revalidatePath("/guest-stay");
  return result.count ? { message: "Request marked resolved." } : { error: "Request not found." };
}
export async function updateStaySettings(_state: ReservationState, form: FormData): Promise<ReservationState> {
  const session = await editor();
  const propertyId = String(form.get("propertyId") || "") || null;
  const raw = String(form.get("availableFrom") || "");
  const availableFrom = raw ? new Date(raw) : null;
  if (availableFrom && Number.isNaN(+availableFrom)) return { error: "Choose a valid availability date." };
  if (propertyId && !await prisma.property.findFirst({ where: { AND: [scopedPropertyWhere(session.activeOrgId!, session.membershipScope), { id: propertyId }] } })) return { error: "Property not found in your assigned scope." };
  const listingId = String(form.get("listingId"));
  const listing = await prisma.$transaction(async tx => {
    const listingScope = await bnbListingScopeWhere(session.activeOrgId!, session.membershipScope, tx);
    await tx.$queryRaw`SELECT "id" FROM "BnbListing" WHERE "id" = ${listingId} AND "orgId" = ${session.activeOrgId!} FOR UPDATE`;
    if (!await tx.bnbListing.findFirst({ where: { AND: [listingScope, { id: listingId }] }, select: { id: true } })) return null;
    if (availableFrom && await tx.bnbReservation.count({ where: { listingId, listing: listingScope, cancelledAt: null, checkedOutAt: null, checkOut: { gt: new Date() }, checkIn: { lt: availableFrom } } })) return null;
    return tx.bnbListing.update({ where: { id: listingId, orgId: session.activeOrgId!, deletedAt: null }, data: { propertyId, availableFrom } });
  });
  if (!listing) return { error: "Availability cannot start after an active booking's check-in. Update the booking first." };
  refresh(listing.slug);
  return { message: "Availability and property link updated." };
}
