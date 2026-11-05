import { XML_HEADERS } from '@/lib/sitemap-utils'

export async function GET() {
  const { buildVacancyDetailSitemapXml } = await import('@/lib/public-vacancy-sitemap')
  return new Response(await buildVacancyDetailSitemapXml(), {
    headers: XML_HEADERS,
  })
}
