import { APP_URL, XML_HEADERS, buildSitemapIndexEntry, wrapSitemapIndex } from '@/lib/sitemap-utils'

export async function renderSitemapXml() {
  const sitemaps = [`${APP_URL}/sitemap.xml`, `${APP_URL}/sitemap-vacancies.xml`]

  const entries = sitemaps.map((s) => buildSitemapIndexEntry(s))
  return wrapSitemapIndex(entries)
}

export async function GET() {
  return new Response(await renderSitemapXml(), {
    headers: XML_HEADERS,
  })
}
