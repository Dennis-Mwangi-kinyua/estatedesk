import { prisma } from '@/lib/prisma'
import { APP_URL, XML_HEADERS, buildUrlEntry, wrapUrlset, formatDate } from '@/lib/sitemap-utils'

export async function renderSitemapXml() {
  const properties = await prisma.property.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    take: 2000,
  })

  const urls = properties
    .map((p) =>
      buildUrlEntry({
        loc: `${APP_URL}/properties/${p.id}`,
        lastmod: formatDate(p.updatedAt),
        changefreq: 'weekly',
        priority: '0.7',
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
