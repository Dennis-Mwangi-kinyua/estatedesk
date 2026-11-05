import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isTransientDatabaseError } from "@/lib/db/retry";
import { bnbImages, bnbReservationDates } from "./queries";

export async function getPublicStayPage(where: Prisma.BnbListingWhereInput, requestedPage: number) {
  try {
    const total = await prisma.bnbListing.count({ where });
    const page = Math.min(
      Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
      Math.max(1, Math.ceil(total / 12)),
    );
    const listings = await prisma.bnbListing.findMany({
      where,
      include: { reservations: bnbReservationDates, images: { ...bnbImages, take: 1 }, org: { select: { currencyCode: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * 12,
      take: 12,
    });
    return { available: true as const, total, page, listings };
  } catch (error) {
    const schemaUnavailable = error instanceof Prisma.PrismaClientKnownRequestError
      && (error.code === "P2021" || error.code === "P2022");
    if (!schemaUnavailable && !isTransientDatabaseError(error)) throw error;
    console.error("Public stays lookup failed.", {
      code: error && typeof error === "object" && "code" in error ? error.code : undefined,
      ...(schemaUnavailable ? { action: "Apply pending Prisma migrations to the configured database." } : {}),
    });
    return { available: false as const, total: 0, page: 1, listings: [] };
  }
}
