import {
  APP_URL,
  PUBLIC_SITEMAP_PATHS,
  XML_HEADERS,
  buildSitemapIndexEntry,
  wrapSitemapIndex,
} from '@/lib/sitemap-utils'

async function renderSitemapXml() {
  const entries = PUBLIC_SITEMAP_PATHS.map((path) => buildSitemapIndexEntry(`${APP_URL}${path}`))
  return wrapSitemapIndex(entries)
}

export async function GET() {
  return new Response(await renderSitemapXml(), {
    headers: XML_HEADERS,
  })
}
