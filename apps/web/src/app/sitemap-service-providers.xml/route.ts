import { prisma } from "@/lib/prisma";
import { visibleProviderWhere } from "@/features/providers/service";
import { APP_URL, buildUrlEntry, formatDate, wrapUrlset } from "@/lib/sitemap-utils";
export const dynamic = "force-dynamic";
export async function GET() {
  const providers = await prisma.serviceProvider.findMany({ where: visibleProviderWhere, select: { id: true, updatedAt: true }, orderBy: { id: "asc" }, take: 50000 });
  return new Response(wrapUrlset(providers.map(provider => buildUrlEntry({ loc: `${APP_URL}/service-providers/${provider.id}`, lastmod: formatDate(provider.updatedAt), changefreq: "weekly", priority: "0.7" })).join("\n")), { headers: { "Content-Type": "application/xml", "Cache-Control": "no-store" } });
}
