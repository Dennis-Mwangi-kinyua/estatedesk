import { APP_URL, XML_HEADERS, buildUrlEntry, wrapUrlset } from '@/lib/sitemap-utils'
import { publicSiteIndexItems } from '@/lib/public-site-index'

async function renderSitemapXml() {
  const urls = publicSiteIndexItems
    .map((e) =>
      buildUrlEntry({
        loc: `${APP_URL}${e.path}`,
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
