import { getVacancyListPagesSitemapXml } from "@/lib/public-vacancy-list-sitemap";
import { XML_HEADERS } from "@/lib/sitemap-utils";

export async function GET() {
  return new Response(await getVacancyListPagesSitemapXml(), {
    headers: XML_HEADERS,
  });
}