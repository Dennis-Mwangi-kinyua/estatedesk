import { XML_HEADERS, wrapUrlset } from '@/lib/sitemap-utils'

export async function renderSitemapXml() {
  return wrapUrlset('')
}

export async function GET() {
  return new Response(await renderSitemapXml(), {
    headers: XML_HEADERS,
  })
}
