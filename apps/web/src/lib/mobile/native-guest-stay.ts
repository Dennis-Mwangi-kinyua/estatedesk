import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { isNativeRequest, mobileJson } from "@/lib/mobile/api";
import { readBoundedJson } from "@/lib/security/bounded-json";
import { guestHash } from "@/features/bnb/guest/session";
import { stayIsAccessible } from "@/features/bnb/availability";

const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
function token(request: Request) {
  const value = request.headers.get("x-estatedesk-guest-token") ?? "";
  return tokenPattern.test(value) ? value : null;
}
function ip(request: Request) {
  return request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
async function activeStay(value: string) {
  const stay = await prisma.bnbReservation.findUnique({ where: { guestTokenHash: guestHash(value) }, include: { listing: { include: { org: { select: { name: true, status: true, deletedAt: true } } } }, requests: { orderBy: { createdAt: "desc" }, take: 20 } } });
  if (!stay || !stayIsAccessible(stay) || stay.listing.deletedAt || stay.listing.org.deletedAt || stay.listing.org.status !== "ACTIVE") return null;
  return stay;
}
export async function nativeGuestSession(request: Request) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  const value = token(request);
  if (!value) return mobileJson({ error: "Enter a valid guest access code." }, 401);
  const limit = await checkRateLimit({ key: `native-stay-session:${ip(request)}`, limit: 30, windowMs: 60_000 });
  if (!limit.allowed) return mobileJson({ error: "Too many attempts. Please wait a minute." }, 429);
  const stay = await activeStay(value);
  if (!stay) return mobileJson({ error: "This guest access code is invalid or the stay is not active." }, 401);
  return mobileJson({ guestName: stay.guestName, checkIn: stay.checkIn, checkOut: stay.checkOut, listing: stay.listing.title, location: stay.listing.location, host: stay.listing.org.name,
    requests: stay.requests.map(item => ({ id: item.id, message: item.message, createdAt: item.createdAt, resolved: !!item.resolvedAt })) });
}
export async function nativeGuestLogin(request: Request) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  const limit = await checkRateLimit({ key: `stay-login:${ip(request)}`, limit: 15, windowMs: 60_000 });
  if (!limit.allowed) return mobileJson({ error: "Too many attempts. Please wait a minute." }, 429);
  const parsed = z.object({ code: z.string().trim().regex(tokenPattern) }).safeParse(await readBoundedJson(request, 2048).catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Enter a valid guest access code." }, 400);
  const stay = await activeStay(parsed.data.code);
  if (!stay) return mobileJson({ error: "This guest access code is invalid or the stay is not active." }, 401);
  return mobileJson({ ok: true, guestToken: parsed.data.code });
}
export async function nativeGuestRequest(request: Request) {
  if (!isNativeRequest(request)) return mobileJson({ error: "Native client required." }, 403);
  const value = token(request);
  if (!value) return mobileJson({ error: "Your guest access has expired. Contact your host." }, 401);
  const stay = await activeStay(value);
  if (!stay) return mobileJson({ error: "Your guest access has expired. Contact your host." }, 401);
  const limit = await checkRateLimit({ key: `stay-request:${stay.id}`, limit: 10, windowMs: 3600000 });
  if (!limit.allowed) return mobileJson({ error: "Please wait before sending another request." }, 429);
  const parsed = z.object({ message: z.string().trim().min(5).max(2000) }).safeParse(await readBoundedJson(request, 4096).catch(() => null));
  if (!parsed.success) return mobileJson({ error: "Use between 5 and 2,000 characters." }, 400);
  await prisma.bnbGuestRequest.create({ data: { reservationId: stay.id, message: parsed.data.message } });
  return mobileJson({ ok: true, message: "Your request has been sent to the host." });
}
