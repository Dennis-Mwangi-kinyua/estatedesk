import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stayIsAccessible } from "../availability";
export const GUEST_COOKIE = "estatedesk-stay-access";
export const guestHash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function getGuestStay() {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const stay = await prisma.bnbReservation.findUnique({ where: { guestTokenHash: guestHash(token) }, include: { listing: { include: { org: { select: { name: true, status: true, deletedAt: true } } } }, requests: { orderBy: { createdAt: "desc" }, take: 20 } } });
  if (!stay || !stayIsAccessible(stay) || stay.listing.deletedAt || stay.listing.org.deletedAt || stay.listing.org.status !== "ACTIVE") return null;
  return stay;
}
