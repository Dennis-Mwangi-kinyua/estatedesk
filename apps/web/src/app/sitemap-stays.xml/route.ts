import { prisma } from "@/lib/prisma";
import { publicBnbWhere } from "@/features/bnb/queries";
import { APP_URL, buildUrlEntry, formatDate, wrapUrlset } from "@/lib/sitemap-utils";
export const dynamic = "force-dynamic";
export async function GET() {
  const listings = await prisma.bnbListing.findMany({ where: publicBnbWhere, select: { slug: true, updatedAt: true }, orderBy: { id: "asc" }, take: 50000 });
  return new Response(wrapUrlset(listings.map((listing) => buildUrlEntry({ loc: `${APP_URL}/stays/${listing.slug}`, lastmod: formatDate(listing.updatedAt), changefreq: "weekly", priority: "0.8" })).join("\n")), {
    headers: { "Content-Type": "application/xml", "Cache-Control": "no-store" },
  });
}
