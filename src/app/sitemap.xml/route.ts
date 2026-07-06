import { APP_URL, XML_HEADERS, buildUrlEntry, formatDate, wrapUrlset } from '@/lib/sitemap-utils'
import { publicSiteIndexItems } from '@/lib/public-site-index'

async function renderSitemapXml() {
  const urls = publicSiteIndexItems
    .map((e) =>
      buildUrlEntry({
        loc: `${APP_URL}${e.path}`,
        lastmod: e.lastmod ? formatDate(e.lastmod) : undefined,
        changefreq: e.changefreq,
        priority: e.priority,
      }),
    )
    .join('\n')

  return wrapUrlset(urls)
}

export async function GET() {
  return new Response(await renderSitemapXml(), {
    headers: XML_HEADERS,
  })
}
