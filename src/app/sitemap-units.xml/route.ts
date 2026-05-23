import { prisma } from '@/lib/prisma'
import { APP_URL, XML_HEADERS, buildUrlEntry, wrapUrlset, formatDate } from '@/lib/sitemap-utils'

export async function renderSitemapXml() {
  const units = await prisma.unit.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    take: 2000,
  })

  const urls = units
    .map((u) =>
      buildUrlEntry({
        loc: `${APP_URL}/units/${u.id}`,
        lastmod: formatDate(u.updatedAt),
        changefreq: 'monthly',
        priority: '0.5',
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
