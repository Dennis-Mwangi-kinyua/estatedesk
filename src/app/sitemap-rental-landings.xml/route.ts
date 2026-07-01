import { buildRentalLandingSitemapXml } from '@/lib/public-vacancy-sitemap'
import { XML_HEADERS } from '@/lib/sitemap-utils'

export async function GET() {
  return new Response(await buildRentalLandingSitemapXml(), {
    headers: XML_HEADERS,
  })
}
