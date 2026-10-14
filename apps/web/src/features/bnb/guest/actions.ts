"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { guestHash, GUEST_COOKIE, getGuestStay } from "./session";
import { stayIsAccessible } from "../availability";
export type GuestState = { error?: string; message?: string };
export async function guestLogin(_state: GuestState, form: FormData): Promise<GuestState> {
  const header = await headers();
  const ip = header.get("x-real-ip") ?? header.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const token = String(form.get("code") ?? "").trim();
  try {
    const limit = await checkRateLimit({ key: `stay-login:${ip}`, limit: 15, windowMs: 60000 });
    if (!limit.allowed) return { error: "Too many attempts. Please wait a minute." };
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return { error: "The access code is invalid or this stay is not currently active." };
    const stay = await prisma.bnbReservation.findUnique({ where: { guestTokenHash: guestHash(token) }, include: { listing: { select: { deletedAt: true, org: { select: { status: true, deletedAt: true } } } } } });
    if (!stay || !stayIsAccessible(stay) || stay.listing.deletedAt || stay.listing.org.deletedAt || stay.listing.org.status !== "ACTIVE") return { error: "The access code is invalid or this stay is not currently active." };
    (await cookies()).set(GUEST_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/guest-stay", maxAge: 365 * 86400 });
  } catch { return { error: "Guest login is temporarily unavailable. Please try again." }; }
  redirect("/guest-stay");
}
export async function guestLogout() { (await cookies()).delete({ name: GUEST_COOKIE, path: "/guest-stay" }); redirect("/guest-stay"); }
export async function submitGuestRequest(_state: GuestState, form: FormData): Promise<GuestState> {
  const stay = await getGuestStay();
  if (!stay) return { error: "Your stay access has expired. Contact your host." };
  const message = String(form.get("message") ?? "").trim();
  if (message.length < 5 || message.length > 2000) return { error: "Use between 5 and 2,000 characters." };
  const limit = await checkRateLimit({ key: `stay-request:${stay.id}`, limit: 10, windowMs: 3600000 });
  if (!limit.allowed) return { error: "Please wait before sending another request." };
  await prisma.bnbGuestRequest.create({ data: { reservationId: stay.id, message } });
  revalidatePath("/guest-stay"); revalidatePath(`/dashboard/org/airbnb/${stay.listing.slug}/bookings`);
  return { message: "Your request has been sent to the host." };
}
