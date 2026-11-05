import { XML_HEADERS } from '@/lib/sitemap-utils'

export async function GET() {
  const { buildRentalLandingSitemapXml } = await import('@/lib/public-vacancy-sitemap')
  return new Response(await buildRentalLandingSitemapXml(), {
    headers: XML_HEADERS,
  })
}
